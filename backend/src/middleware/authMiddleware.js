import dbService from '../utils/dbService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export const verifyToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    request.user = {
      ...decoded,
      id: decoded.userId || decoded.id
    };
  } catch (error) {
    return reply.status(401).send({ message: 'Invalid or expired token' });
  }
};

export const checkResume = async (request, reply) => {
  const user = await dbService.find('users', u => u.id === request.user.id);
  if (!user || !user.resumeText) {
    return reply.status(403).send({
      code: 'RESUME_MISSING',
      message: 'Resume upload is mandatory to access the dashboard.'
    });
  }
};

export default verifyToken;
