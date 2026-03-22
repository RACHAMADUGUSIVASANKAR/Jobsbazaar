import dbService from '../utils/dbService.js';

const baseFilters = {
    role: '',
    location: '',
    skills: '',
    workMode: 'All',
    matchScore: 'All',
    datePosted: 'Any'
};

const toLow = (value) => String(value || '').trim().toLowerCase();

const activeJobs = async () => {
    const jobs = await dbService.get('jobs');
    return jobs.filter((job) => job.isActive !== false);
};

const applySkillFilter = (jobs = [], skill = '') => {
    const token = toLow(skill);
    if (!token) return jobs;
    return jobs.filter((job) => {
        const text = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
        return text.includes(token);
    });
};

const applyLocationFilter = (jobs = [], location = '') => {
    const token = toLow(location);
    if (!token) return jobs;
    return jobs.filter((job) => toLow(job.location).includes(token));
};

const executeToolAction = async ({ type, payload = {} } = {}) => {
    const action = String(type || '').trim();

    switch (action) {
        case 'setFilters':
            return {
                action,
                filters: {
                    ...baseFilters,
                    ...payload
                }
            };

        case 'resetFilters':
            return {
                action,
                filters: { ...baseFilters }
            };

        case 'updateMatchScoreFilter':
            return {
                action,
                filters: {
                    ...baseFilters,
                    matchScore: payload.matchScore || 'All'
                }
            };

        case 'searchBySkill': {
            const jobs = await activeJobs();
            const items = applySkillFilter(jobs, payload.skill || payload.skills || '');
            return {
                action,
                count: items.length,
                items: items.slice(0, 20)
            };
        }

        case 'searchByLocation': {
            const jobs = await activeJobs();
            const items = applyLocationFilter(jobs, payload.location || '');
            return {
                action,
                count: items.length,
                items: items.slice(0, 20)
            };
        }

        default:
            return {
                action: action || 'none',
                message: 'No executable tool action found.'
            };
    }
};

const assistantController = {
    setFilters: async (request, reply) => {
        const result = await executeToolAction({ type: 'setFilters', payload: request.body || {} });
        return reply.status(200).send(result);
    },

    resetFilters: async (request, reply) => {
        const result = await executeToolAction({ type: 'resetFilters', payload: {} });
        return reply.status(200).send(result);
    },

    updateMatchScoreFilter: async (request, reply) => {
        const result = await executeToolAction({ type: 'updateMatchScoreFilter', payload: request.body || {} });
        return reply.status(200).send(result);
    },

    searchBySkill: async (request, reply) => {
        const result = await executeToolAction({ type: 'searchBySkill', payload: { skill: request.params.skill } });
        return reply.status(200).send(result);
    },

    searchByLocation: async (request, reply) => {
        const result = await executeToolAction({ type: 'searchByLocation', payload: { location: request.params.location } });
        return reply.status(200).send(result);
    },

    executeToolAction
};

export default assistantController;
