module.exports = {
  apps: [
    {
      name: "dinarweb",
      script: "server.py",
      interpreter: "python3",
      cwd: "/srv/dinarweb",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        PYTHONUNBUFFERED: "1",
      },
      error_file: "/var/log/dinarweb/err.log",
      out_file: "/var/log/dinarweb/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
