import { Router } from 'express';
import healthRouter from './health.js';
import meRouter from './me.js';
import roomsRouter from './rooms.js';

export function createRouter() {
  const router = Router();
  router.use(healthRouter);
  router.use(meRouter);
  router.use(roomsRouter);
  return router;
}