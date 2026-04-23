const db = require('../models');

/**
 * Job Controller
 * Handles administrative operations related to the background job queue.
 */

// GET /api/jobs
const getJobs = async (req, res, next) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const jobs = await db.Job.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        if (res.success) {
            return res.success(jobs, 'Jobs retrieved successfully');
        }
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        next(error);
    }
};

// GET /api/jobs/:id
const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await db.Job.findByPk(id);

        if (!job) {
             return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (res.success) {
            return res.success(job, 'Job retrieved successfully');
        }
        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// POST /api/jobs/retry/:id
const retryJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await db.Job.findByPk(id);

        if (!job) {
             return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (job.status !== 'FAILED') {
             return res.status(400).json({ success: false, message: 'Only FAILED jobs can be retried' });
        }

        // Reset the job back to PENDING
        job.status = 'PENDING';
        job.error_log = null;
        await job.save();

        if (res.success) {
            return res.success(job, 'Job has been marked for retry');
        }
        res.status(200).json({ success: true, message: 'Job has been marked for retry', data: job });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getJobs,
    getJobById,
    retryJob
};
