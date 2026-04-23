const { v4: uuidv4 } = require('uuid');
const { IdempotencyKey } = require('../models');

const correlationMiddleware = (req, res, next) => {
    req.correlationId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.correlationId);
    next();
};

const idempotencyMiddleware = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) return next(); // Not strictly enforced for all routes, just if provided

    try {
        const existing = await IdempotencyKey.findByPk(key);
        if (existing) {
            if (existing.locked_at && new Date() - existing.locked_at < 30000) {
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
            correlation_id: req.correlationId,
            locked_at: new Date()
        });

        // Intercept response
        const originalSend = res.send;
        res.send = function (body) {
            res.send = originalSend;
            
            // Async save the final response
            try {
                const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
                IdempotencyKey.update({
                    response_body: parsedBody,
                    response_status: res.statusCode,
                    locked_at: null
                }, { where: { idempotency_key: key } }).catch(console.error);
            } catch (e) {
                console.error('Failed to parse response body for idempotency store', e);
            }

            return res.send(body);
        };

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { correlationMiddleware, idempotencyMiddleware };
