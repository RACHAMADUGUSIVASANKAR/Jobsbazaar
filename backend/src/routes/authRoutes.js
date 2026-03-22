import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleLogin,
  googleLoginRedirect,
  googleCallback
} from '../controllers/authController.js';

async function authRoutes(fastify) {
  fastify.post('/signup', signup);
  fastify.post('/login', login);
  fastify.post('/forgot-password', forgotPassword);
  fastify.post('/reset-password', resetPassword);
  fastify.post('/verify-email', verifyEmail);
  fastify.get('/google', googleLoginRedirect);
  fastify.get('/google-login', googleLoginRedirect);
  fastify.get('/google-callback', googleCallback);
  fastify.post('/google-login', googleLogin);
}

export default authRoutes;
