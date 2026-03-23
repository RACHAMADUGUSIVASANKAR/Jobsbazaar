import jobController from '../controllers/jobController.js';
import { getWorkerStats_endpoint, getDeploymentStatus_endpoint } from '../controllers/adminController.js';
import { verifyToken, checkResume } from '../middleware/authMiddleware.js';

const jobRoutes = async (fastify, options) => {
  // Dashboard job surfaces are resume-gated to prevent bypassing mandatory upload.
  fastify.get('/', { preHandler: [verifyToken, checkResume] }, jobController.getJobFeed);
  fastify.get('/feed', { preHandler: [verifyToken, checkResume] }, jobController.getJobFeed);
  fastify.get('/best-matches', { preHandler: [verifyToken, checkResume] }, jobController.getBestMatches);
  fastify.post('/refresh-live', { preHandler: [verifyToken, checkResume] }, jobController.refreshLiveJobs);
  fastify.get('/notifications', { preHandler: [verifyToken, checkResume] }, jobController.getNotifications);
  fastify.get('/saved', { preHandler: [verifyToken, checkResume] }, jobController.getSavedJobs);
  fastify.post('/:id/apply', { preHandler: [verifyToken, checkResume] }, jobController.trackApply);
  fastify.post('/:id/decision', { preHandler: [verifyToken, checkResume] }, jobController.trackApplicationDecision);
  fastify.post('/:id/save', { preHandler: [verifyToken, checkResume] }, jobController.saveJob);
  fastify.delete('/:id/save', { preHandler: [verifyToken, checkResume] }, jobController.removeSavedJob);
  fastify.post('/:id/move-to-applied', { preHandler: [verifyToken, checkResume] }, jobController.moveSavedToApplied);
  fastify.post('/:id/cover-letter-pack', { preHandler: [verifyToken, checkResume] }, jobController.generateCoverLetterPack);
  fastify.get('/applications', { preHandler: [verifyToken, checkResume] }, jobController.getApplications);
};

// Global applications route (or under jobs prefix)
const appRoutes = async (fastify, options) => {
  fastify.get('/', { preHandler: [verifyToken, checkResume] }, jobController.getApplications);
};

// Phase 6: Admin observability routes (for deployment monitoring)
const adminRoutes = async (fastify, options) => {
  fastify.get('/workers/stats', { preHandler: [verifyToken] }, getWorkerStats_endpoint);
  fastify.get('/deployment-status', { preHandler: [verifyToken] }, getDeploymentStatus_endpoint);
};

export { jobRoutes as default, appRoutes, adminRoutes };
