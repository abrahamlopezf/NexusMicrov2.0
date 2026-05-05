const { v4: uuidv4 } = require('uuid');
const { IdempotencyKey } = require('../models');

const correlationMiddleware = (req, res, next) => {
    try {
        req.correlationId = req.headers['x-request-id'] || uuidv4();
    } catch (e) {
        req.correlationId = `corr-${Date.now()}`;
    }
    res.setHeader('X-Request-ID', req.correlationId || 'unknown');
    next();
};

const idempotencyMiddleware = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) return next(); 

    try {
        if (!IdempotencyKey) return next();

        const existing = await IdempotencyKey.findByPk(key);
        if (existing) {
            if (existing.locked_at && new Date() - new Date(existing.locked_at) < 30000) {
                return res.status(409).json({ status: 'error', message: 'Request in progress' });
            }
            return res.status(existing.response_status).json(existing.response_body);
        }

        // Lock the key
        await IdempotencyKey.create({
            idempotency_key: key,
            request_path: req.originalUrl,
            response_body: {},
            response_status: 202,
            correlation_id: req.correlationId || 'no-corr',
            locked_at: new Date()
        });

        const originalSend = res.send;
        res.send = function (body) {
            res.send = originalSend;
            try {
                const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
                IdempotencyKey.update({
                    response_body: parsedBody,
                    response_status: res.statusCode,
                    locked_at: null
                }, { where: { idempotency_key: key } }).catch(console.error);
            } catch (e) {
                // Ignore parsing errors for non-json responses
            }
            return res.send(body);
        };

        next();
    } catch (err) {
        console.error('Idempotency error:', err);
        next(); // Don't block if idempotency fails
    }
};

module.exports = { correlationMiddleware, idempotencyMiddleware };
