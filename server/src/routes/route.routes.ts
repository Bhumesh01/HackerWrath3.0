import { Router } from 'express';
import {
  createRoute,
  getRoute,
  submitRouteFeedback,
} from '../controllers/route.controller.js';
<<<<<<< HEAD
=======
import { requireAuth } from '../middleware/auth.js';
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import { validateBody } from '../middleware/validate.js';
import {
  createRouteSchema,
  routeFeedbackSchema,
} from '../validators/route.validator.js';

const router = Router();

<<<<<<< HEAD
=======
router.use(requireAuth);

>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
router.post('/', validateBody(createRouteSchema), createRoute);
router.get('/:routeRequestId', getRoute);
router.post(
  '/:routeRequestId/feedback',
  validateBody(routeFeedbackSchema),
  submitRouteFeedback
);

export default router;
