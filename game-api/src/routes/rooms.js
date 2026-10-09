import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listRoomsQuery, roomRefParam } from '../schemas/requests.js';
import { getRoom, listRooms } from '../services/roomsService.js';
import { asyncHandler } from '../errors.js';

const router = Router();

/**
 * Bu uç noktalar SALT OKUNUR: oda listesi ve oda durumu.
 * Bahis, coin, para çekme gibi finansal işlem yapan uç noktalar bilinçli olarak
 * yoktur (bkz. config.financialOperationsEnabled).
 */
router.get(
  '/v1/rooms',
  authenticate(),
  validate({ query: listRoomsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await listRooms(req.valid.query));
  })
);

router.get(
  '/v1/rooms/:ref',
  authenticate(),
  validate({ params: roomRefParam }),
  asyncHandler(async (req, res) => {
    res.json({ room: await getRoom(req.valid.params.ref) });
  })
);

export default router;