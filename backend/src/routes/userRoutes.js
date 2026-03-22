import userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const userRoutes = async (fastify, options) => {
  fastify.post('/upload-resume', { preHandler: [verifyToken] }, userController.uploadResume);
  fastify.post('/resume', { preHandler: [verifyToken] }, userController.uploadResume);
  fastify.get('/profile', { preHandler: [verifyToken] }, userController.getProfile);
  fastify.put('/profile', { preHandler: [verifyToken] }, userController.updateProfile);
  fastify.delete('/profile', { preHandler: [verifyToken] }, userController.deleteProfile);
};

export default userRoutes;
