import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeErrorResponse } from '../../shared/security.ts';

const DEFAULTS = { border_color: '#ff1744', name_color: '#ffffff' };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body || {};

    if (action === 'get') {
      const records = await base44.asServiceRole.entities.AppConfig.filter({ key: 'cheat_panel_settings' }, '-created_date', 1).catch(() => []);
      const raw = records[0]?.value || '';
      let settings = DEFAULTS;
      try { settings = { ...DEFAULTS, ...JSON.parse(raw) }; } catch {}
      return Response.json({ settings });
    }

    if (action === 'set') {
      const me = await base44.auth.me();
      if (!me || me.role !== 'admin') return Response.json({ error: 'Yetkisiz' }, { status: 403 });
      const settings = {
        border_color: (body.border_color || DEFAULTS.border_color).slice(0, 7),
        name_color: (body.name_color || DEFAULTS.name_color).slice(0, 7),
      };
      const records = await base44.asServiceRole.entities.AppConfig.filter({ key: 'cheat_panel_settings' }, '-created_date', 1).catch(() => []);
      if (records[0]) {
        await base44.asServiceRole.entities.AppConfig.update(records[0].id, { value: JSON.stringify(settings) });
      } else {
        await base44.asServiceRole.entities.AppConfig.create({ key: 'cheat_panel_settings', value: JSON.stringify(settings) });
      }
      return Response.json({ ok: true, settings });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (e) {
    return safeErrorResponse(e);
  }
}