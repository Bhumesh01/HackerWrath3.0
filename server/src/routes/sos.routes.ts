import { Router } from 'express';
import {
  createSos,
  getSos,
  notifyAgainSos,
  resolveSos,
  revokeSosShare,
  updateSosLocation,
} from '../controllers/sos.controller.js';
<<<<<<< HEAD
=======
import { requireAuth } from '../middleware/auth.js';
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import { locationRateLimiter, sosRateLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import {
  createSosSchema,
  resolveSosSchema,
  updateSosLocationSchema,
} from '../validators/sos.validator.js';

const router = Router();

<<<<<<< HEAD
=======
router.use(requireAuth);

>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
router.post('/', sosRateLimiter, validateBody(createSosSchema), createSos);
router.post(
  '/:incidentId/location',
  locationRateLimiter,
  validateBody(updateSosLocationSchema),
  updateSosLocation
);
router.get('/:incidentId', getSos);
router.post('/:incidentId/resolve', validateBody(resolveSosSchema), resolveSos);
router.post('/:incidentId/share/revoke', revokeSosShare);
router.post('/:incidentId/notify-again', sosRateLimiter, notifyAgainSos);

export default router;
