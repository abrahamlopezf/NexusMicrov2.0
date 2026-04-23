const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');

// Security & Formatting Middlewares
const sanitize = require('./middlewares/sanitizeMiddleware');
const rateLimitMiddleware = require('./middlewares/rateLimitMiddleware');
const responseFormatter = require('./middlewares/responseFormatterMiddleware');

// Observability Middlewares
const tracerMiddleware = require('./observability/tracer');
const requestMetrics = require('./middlewares/requestMetricsMiddleware');
const errorLogger = require('./middlewares/errorLoggerMiddleware');
const notFoundHandler = require('./middlewares/notFoundMiddleware');
const errorHandler = require('./middlewares/errorHandler');

const routes = require('./routes/index');

// Initialize app
const app = express();

// 1. Tracer - attach ID early
app.use(tracerMiddleware);

// 2. Metrics - track timing from start
app.use(requestMetrics);

// Response formatter
app.use(responseFormatter);

// Core Middlewares
app.use(helmet()); 
app.use(cors({ origin: config.corsOrigin || '*' })); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);
app.use('/api', rateLimitMiddleware);

if (config.nodeEnv === 'development') {
    app.use(morgan('dev')); 
}

// 3. Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    if (res.success) {
        return res.success({ traceId: req.traceId }, 'Welcome to the NexusMicro Backend API');
    }
    res.status(200).json({ success: true, message: 'Welcome to the NexusMicro Backend API' });
});

app.use(notFoundHandler);

// 4. Error Logger
app.use(errorLogger);

// 5. Error Handler
app.use(errorHandler);

module.exports = app;
