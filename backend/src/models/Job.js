import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        externalJobId: { type: String, default: '', index: true },
        title: { type: String, required: true, index: true },
        company: { type: String, default: 'Unknown Company', index: true },
        location: { type: String, default: 'Remote', index: true },
        category: { type: String, default: 'Engineering' },
        description: { type: String, default: '' },
        redirect_url: { type: String, default: '' },
        created: { type: String, default: '' },
        salary_min: { type: Number, default: null },
        salary_max: { type: Number, default: null },
        contract_time: { type: String, default: 'full_time' },
        source: { type: String, default: '' },

        dedupeCompositeSignature: { type: String, default: '' },
        dedupeSemanticSignature: { type: String, default: '' },

        isActive: { type: Boolean, default: true, index: true },
        status: { type: String, default: 'Active', index: true },
        syncMissedCount: { type: Number, default: 0 },

        sourceFetchedAt: { type: Date, default: null },
        lastSeenAt: { type: Date, default: null, index: true },
        closedAt: { type: Date, default: null },

        scoreRefreshedAt: { type: Date, default: null },
        bestMatchRefreshedAt: { type: Date, default: null },
        matchScore: { type: Number, default: null, index: true },
        matchExplanation: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

JobSchema.index({ title: 1, company: 1, location: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ lastSeenAt: -1, isActive: 1 });

const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);

export default Job;
