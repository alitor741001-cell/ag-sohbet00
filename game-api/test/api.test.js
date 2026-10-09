import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

// Test ortamı: gerçek sır yok, ağa çıkılmaz (Supabase istemcisi kurulur ama çağrılmaz).
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-000000000000';
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-0000000000000000';
process.env.GAME_API_KEY = 'test-game-api-key-00000000000000000000';
process.env.ROLE_LOOKUP_ENABLED = 'false';
process.env.RATE_LIMIT_MAX = '1000';

const { createApp } = await import('../src/app.js');
const { signServiceToken } = await import('../src/auth/tokens.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

describe('sağlık kontrolü', () => {
  it('/health kimlik doğrulaması istemeden 200 döner', async () => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.features.financialOperations, false);
    assert.equal(body.dependencies.supabase, 'not_checked');
  });
});

describe('kimlik doğrulama', () => {
  it('token olmadan /v1/me 401 döner', async () => {
    const response = await fetch(`${base}/v1/me`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHORIZED');
  });

  it('geçersiz token 401 döner', async () => {
    const response = await fetch(`${base}/v1/me`, {
      headers: { authorization: 'Bearer bu-gecerli-bir-token-degil' },
    });
    assert.equal(response.status, 401);
  });

  it('geçerli servis tokenı ile kullanıcı ve rol döner', async () => {
    const token = await signServiceToken({
      userId: '11111111-1111-1111-1111-111111111111',
      role: 'admin',
      ttlSeconds: 60,
    });

    const response = await fetch(`${base}/v1/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.user.id, '11111111-1111-1111-1111-111111111111');
    assert.equal(body.user.role, 'admin');
    assert.equal(body.auth.kind, 'service');
  });
});

describe('istek doğrulaması', () => {
  it('sınır dışı limit 400 döner', async () => {
    const token = await signServiceToken({
      userId: '22222222-2222-2222-2222-222222222222',
      ttlSeconds: 60,
    });

    const response = await fetch(`${base}/v1/rooms?limit=500`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 400);

    const body = await response.json();
    assert.equal(body.error.code, 'BAD_REQUEST');
    assert.equal(body.error.details.part, 'query');
  });

  it('geçersiz oda kimliği 400 döner', async () => {
    const token = await signServiceToken({
      userId: '22222222-2222-2222-2222-222222222222',
      ttlSeconds: 60,
    });

    // "ab" oda kimliği için gereken en az uzunluğun altında kalır.
    const response = await fetch(`${base}/v1/rooms/ab`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.details.part, 'params');
  });
});

describe('bilinmeyen uç nokta', () => {
  it('404 JSON döner', async () => {
    const response = await fetch(`${base}/bilinmeyen`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'NOT_FOUND');
  });
});