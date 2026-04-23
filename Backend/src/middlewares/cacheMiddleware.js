const NodeCache = require('node-cache');

// Standard TTL 5 minutes to prevent hammering the heavy Dashboard Service SQL
const apiCache = new NodeCache({ stdTTL: 300 });

const cacheResponse = (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const cachedResponse = apiCache.get(key);

    if (cachedResponse) {
        return res.json({ ...cachedResponse, _cached: true, _cachedAt: new Date() });
    } else {
        // Intercept native express .json() method execution
        res.originalJson = res.json;
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Save JSON output back into RAM
                apiCache.set(key, body);
            }
            res.originalJson(body);
        };
        next();
    }
};

const clearGlobalCache = () => {
    apiCache.flushAll();
};

module.exports = { cacheResponse, clearGlobalCache, apiCache };
