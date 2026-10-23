import { Router } from 'express';
import {
  acceptContact,
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '../controllers/contact.controller.js';
<<<<<<< HEAD
import { invitationRateLimiter } from '../middleware/rateLimiter.js';
=======
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import { validateBody } from '../middleware/validate.js';
import {
  acceptContactSchema,
  createContactSchema,
  updateContactSchema,
} from '../validators/contact.validator.js';

const router = Router();

// Accept invitation: unauthenticated, token-authorized with rate limiting
router.post(
  '/:contactId/accept',
<<<<<<< HEAD
  invitationRateLimiter,
=======
  authRateLimiter,
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
  validateBody(acceptContactSchema),
  acceptContact
);

// Protected routes (require user session)
<<<<<<< HEAD
=======
router.use(requireAuth);

>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
router.get('/', listContacts);
router.post('/', validateBody(createContactSchema), createContact);
router.patch('/:contactId', validateBody(updateContactSchema), updateContact);
router.delete('/:contactId', deleteContact);

export default router;
