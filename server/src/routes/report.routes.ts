import { Router } from 'express';
import {
  confirmReport,
  createReport,
  getReports,
  retractReport,
} from '../controllers/report.controller.js';
<<<<<<< HEAD
=======
import { requireAuth } from '../middleware/auth.js';
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import { reportRateLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createReportSchema,
  reportBboxQuerySchema,
} from '../validators/report.validator.js';

const router = Router();

// Public query endpoint for map viewing
router.get('/', validateQuery(reportBboxQuerySchema), getReports);

// Protected endpoints
router.post(
  '/',
<<<<<<< HEAD
=======
  requireAuth,
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
  reportRateLimiter,
  validateBody(createReportSchema),
  createReport
);
<<<<<<< HEAD
router.post('/:reportId/confirm', confirmReport);
router.post('/:reportId/retract', retractReport);
=======
router.post('/:reportId/confirm', requireAuth, confirmReport);
router.post('/:reportId/retract', requireAuth, retractReport);
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c

export default router;
