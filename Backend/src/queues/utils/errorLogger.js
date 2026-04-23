const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/queue-errors.log');

// Ensure directory exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

function logQueueError(jobType, payload, error) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] JOB TYPE: ${jobType}\nPAYLOAD: ${JSON.stringify(payload)}\nERROR: ${error.stack || error}\n-----------------------------------\n`;
  fs.appendFileSync(logFilePath, logEntry);
}

module.exports = logQueueError;
