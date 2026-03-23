const nodeRateLimit = require('express-rate-limit');

const globalLimit = nodeRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: { status: 'error', message: 'Too many requests' }
});

const scoreLimit = nodeRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 score submissions per hour
    message: { status: 'error', message: 'Score submission limit reached' }
});

module.exports = { globalLimit, scoreLimit };
