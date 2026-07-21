import path from "node:path";
import { config } from "dotenv";

const rootDir = path.resolve(__dirname);

config({ path: path.join(rootDir, ".env.local") });
config({ path: path.join(rootDir, ".env") });

async function main() {
  const { createServer } = await import("http");
  const { parse } = await import("url");
  const { default: next } = await import("next");
  const { checkAdmin } = await import("./app/jobs/system/sys-jobs");
  const { startCronScheduler } = await import("./lib/cron/scheduler");

  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev, dir: rootDir });
  const handle = app.getRequestHandler();

  app.prepare().then(async () => {
    await checkAdmin();
    startCronScheduler();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || "0.0.0.0";

    server.listen(port, hostname, () => {
      console.log(
        `> Ready on http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port} (${dev ? "dev" : "production"})`,
      );
    });
  });
}

main();
