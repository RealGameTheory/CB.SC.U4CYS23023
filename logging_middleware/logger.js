const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, 'app.log');

class Logger {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  _format(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      module: this.moduleName,
      message,
      ...(Object.keys(meta).length > 0 ? { meta } : {})
    });
  }

  _write(entry) {
    const line = entry + '\n';
    fs.appendFileSync(LOG_FILE, line);
    process.stdout.write(line);
  }

  info(message, meta) { this._write(this._format('INFO', message, meta)); }
  warn(message, meta) { this._write(this._format('WARN', message, meta)); }
  error(message, meta) { this._write(this._format('ERROR', message, meta)); }
  debug(message, meta) { this._write(this._format('DEBUG', message, meta)); }
}

function loggingMiddleware(req, res, next) {
  const logger = new Logger('HTTP');
  const start = Date.now();
  logger.info(`--> ${req.method} ${req.url}`);
  res.on('finish', () => {
    logger.info(`<-- ${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`
    });
  });
  next();
}

module.exports = { Logger, loggingMiddleware };
