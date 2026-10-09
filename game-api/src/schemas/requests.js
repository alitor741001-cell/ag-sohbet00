import { z } from 'zod';
import { config } from '../config.js';

/** Oda kimliği: harf, rakam, tire ve alt çizgi; 3-64 karakter. */
const ROOM_REF = /^[A-Za-z0-9_-]{3,64}$/;

export const roomRefParam = z.object({
  ref: z.string().trim().regex(ROOM_REF, 'Geçersiz oda kimliği.'),
});

export const listRoomsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(config.MAX_PAGE_SIZE).default(20),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  status: z.enum(['active', 'all']).default('active'),
});