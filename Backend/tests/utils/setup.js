// tests/utils/setup.js
const db = require('../../src/models');
const logger = require('../../src/observability/logger');

// Mock external systems globally to prevent tests from spamming the console
jest.mock('../../src/observability/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarn: jest.fn(),
    logDebug: jest.fn()
}));

beforeAll(async () => {
    // Authenticate database before running tests
    try {
        await db.sequelize.authenticate();
    } catch (error) {
        console.error("Test Setup Error: Cannot connect to database.");
        throw error;
    }
});

afterAll(async () => {
    // Close connection
    await db.sequelize.close();
});
