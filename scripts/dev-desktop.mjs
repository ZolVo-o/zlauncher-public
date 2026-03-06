import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findPort(start = 5173, attempts = 20) {
  for (let port = start; port < start + attempts; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error("Could not find a free port for Vite dev server.");
}

async function waitForVite(url, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) return true;
    } catch (_error) {
      // wait until dev server is ready
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(500);
  }
  return false;
}

const port = await findPort(5173, 50);
const devUrl = `http://127.0.0.1:${port}`;

const vite = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  if (!vite.killed) vite.kill();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

const ready = await waitForVite(devUrl);
if (!ready) {
  console.error("Vite dev server did not start in time.");
  cleanup();
  process.exit(1);
}

const electron = spawn("npx", ["electron", "."], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, VITE_DEV_SERVER_URL: devUrl },
});

electron.on("exit", (code) => {
  cleanup();
  process.exit(code ?? 0);
});
