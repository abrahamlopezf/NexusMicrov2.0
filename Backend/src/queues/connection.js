/**
 * Redis Connection (ioredis) — Shared singleton for BullMQ
 * Manages connection health and exposes availability state.
 */
const IORedis = require('ioredis');
const config  = require('../config/env');
const logger  = require('../utils/logger');

let connection   = null;
let isAvailable  = false;
let connectError = null;

function createConnection() {
    const opts = {
        host:           config.redis.host,
        port:           config.redis.port,
        password:       config.redis.password,
        tls:            config.redis.tls,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
    };

    const redis = new IORedis(opts);

    redis.on('connect', () => {
        isAvailable  = true;
        connectError = null;
        logger.info('✅ Redis connected (Queue system active)');
    });

    redis.on('ready', () => {
        isAvailable = true;
    });

    redis.on('error', (err) => {
        isAvailable  = false;
        connectError = err;
        logger.warn(`⚠️  Redis unavailable: ${err.message} — Queue mode may fallback to sync`);
    });

    redis.on('close', () => {
        isAvailable = false;
        logger.warn('⚠️  Redis connection closed');
    });

    return redis;
}

/**
 * Returns the shared Redis connection, creating it if needed.
 */
function getConnection() {
    if (!connection) {
        connection = createConnection();
    }
    return connection;
}

/**
 * Attempts lazy connection. Used at server startup.
 */
async function initConnection() {
    try {
        const conn = getConnection();
        await conn.connect();
    } catch (err) {
        // Do not throw — hybrid mode handles this gracefully
        logger.warn(`⚠️  Could not connect to Redis at startup: ${err.message}`);
    }
}

function isRedisAvailable() {
    return isAvailable;
}

function getConnectError() {
    return connectError;
}

module.exports = { getConnection, initConnection, isRedisAvailable, getConnectError };
