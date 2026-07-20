/**
 * PM2 — Windows / Linux
 * Usage: pm2 start ecosystem.config.js
 * Important: do not delete prisma/*.db or public/uploads during updates.
 */
module.exports = {
  apps: [
    {
      name: "tiempo-maintenance",
      cwd: __dirname,
      script: "node_modules/tsx/dist/cli.mjs",
      args: "server.ts",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
