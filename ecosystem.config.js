/**
 * PM2 — Windows / Linux
 * Usage: pm2 start ecosystem.config.js
 * Important: do not delete prisma/*.db or public/uploads during updates.
 *
 * Fork mode is required: cluster mode breaks tsx and duplicates cron jobs.
 */
module.exports = {
  apps: [
    {
      name: "tiempo-maintenance",
      cwd: __dirname,
      script: "node_modules/tsx/dist/cli.mjs",
      args: ["server.ts"],
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      windowsHide: true,
      env: {
        NODE_ENV: "production",
        CRON_ENABLED: "true",
      },
    },
  ],
};
