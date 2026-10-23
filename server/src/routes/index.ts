import { Router } from 'express';
<<<<<<< HEAD
=======
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
import contactRoutes from './contact.routes.js';
import sosRoutes from './sos.routes.js';
import shareRoutes from './share.routes.js';
import routeRoutes from './route.routes.js';
import navigationRoutes from './navigation.routes.js';
import reportRoutes from './report.routes.js';

const apiV1Router = Router();

<<<<<<< HEAD
=======
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/users', userRoutes);
>>>>>>> 0a00a263953ab13e0c5ba1267330ca024156d55c
apiV1Router.use('/contacts', contactRoutes);
apiV1Router.use('/sos', sosRoutes);
apiV1Router.use('/share', shareRoutes);
apiV1Router.use('/routes', routeRoutes);
apiV1Router.use('/navigation', navigationRoutes);
apiV1Router.use('/reports', reportRoutes);

export default apiV1Router;
