import assistantOrchestrator from '../utils/assistantOrchestrator.js';
import assistantController from '../controllers/assistantController.js';
import { verifyToken, checkResume } from '../middleware/authMiddleware.js';

const assistantRoutes = async (fastify, options) => {
  fastify.post('/chat', { preHandler: [verifyToken, checkResume] }, async (request, reply) => {
    const { message, context } = request.body || {};
    if (!message || typeof message !== 'string') {
      return reply.status(400).send({ message: 'Message is required' });
    }

    const result = await assistantOrchestrator.processMessage(
      message,
      context,
      request.user?.id || 'anonymous'
    );

    const uiCall = result?.uiFunctionCall || null;
    const hasAction = uiCall && uiCall.name && uiCall.name !== 'none';
    const toolResult = hasAction
      ? await assistantController.executeToolAction({
        type: uiCall.name,
        payload: uiCall.arguments || {}
      })
      : null;

    return reply.status(200).send({
      ...result,
      toolResult
    });
  });

  fastify.post('/set-filters', { preHandler: [verifyToken, checkResume] }, assistantController.setFilters);
  fastify.post('/setFilters', { preHandler: [verifyToken, checkResume] }, assistantController.setFilters);
  fastify.post('/reset-filters', { preHandler: [verifyToken, checkResume] }, assistantController.resetFilters);
  fastify.post('/resetFilters', { preHandler: [verifyToken, checkResume] }, assistantController.resetFilters);
  fastify.post('/update-match-score-filter', { preHandler: [verifyToken, checkResume] }, assistantController.updateMatchScoreFilter);
  fastify.post('/updateMatchScoreFilter', { preHandler: [verifyToken, checkResume] }, assistantController.updateMatchScoreFilter);
  fastify.get('/search/skill/:skill', { preHandler: [verifyToken, checkResume] }, assistantController.searchBySkill);
  fastify.get('/searchBySkill/:skill', { preHandler: [verifyToken, checkResume] }, assistantController.searchBySkill);
  fastify.get('/search/location/:location', { preHandler: [verifyToken, checkResume] }, assistantController.searchByLocation);
  fastify.get('/searchByLocation/:location', { preHandler: [verifyToken, checkResume] }, assistantController.searchByLocation);
};

export default assistantRoutes;
