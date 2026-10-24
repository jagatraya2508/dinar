const fs = require("fs");
const path = require("path");

// Gunakan /var/log/dinarweb jika ada & dapat ditulis, atau fallback ke ./logs lokal
const hasVarLog = (() => {
  try {
    fs.accessSync("/var/log/dinarweb", fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
})();

const logDir = hasVarLog ? "/var/log/dinarweb" : path.join(__dirname, "logs");

module.exports = {
  apps: [
    {
      name: "dinarweb",
      script: "server.py",
      interpreter: "python3",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        PYTHONUNBUFFERED: "1",
        PORT: "3002",
        HOST: "0.0.0.0",
      },
      error_file: path.join(logDir, "err.log"),
      out_file: path.join(logDir, "out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
