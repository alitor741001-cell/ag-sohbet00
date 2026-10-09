/**
 * Yerel doğrulama aracı: Base44 arka ucunun üreteceği servis tokenının aynısını imzalar.
 * Üretimde token Base44 arka ucunda (sunucu tarafında) üretilmelidir; bu araç yalnızca
 * dağıtım sonrası API'yi denemek içindir.
 *
 * Kullanım:
 *   npm run mint-token -- --user <kullanıcı-uuid> [--role user|moderator|admin] [--ttl 900]
 */
import { config } from '../config.js';
import { signServiceToken } from '../auth/tokens.js';

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const userId = flag('--user');
const role = flag('--role') ?? 'user';
const ttlSeconds = Number(flag('--ttl') ?? 900);

if (!userId) {
  process.stderr.write('Kullanım: npm run mint-token -- --user <uuid> [--role user|moderator|admin] [--ttl 900]\n');
  process.exit(1);
}

if (!['user', 'moderator', 'admin'].includes(role)) {
  process.stderr.write('Rol user, moderator veya admin olmalı.\n');
  process.exit(1);
}

const token = await signServiceToken({ userId, role, ttlSeconds });
process.stdout.write(`${token}\n`);
process.stderr.write(
  `Servis tokenı üretildi (rol talebi: ${role}, geçerlilik: ${ttlSeconds}s). ` +
    `Rol, veritabanında kayıtlıysa oradan okunur; token rolü yalnızca yedektir (en fazla user).\n` +
    `AUTH_MODE: ${config.AUTH_MODE}\n`
);