const server = Bun.spawn(["bun", "--watch", "src/server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: process.env,
});
const client = Bun.spawn(["bunx", "vite"], {
  stdout: "inherit",
  stderr: "inherit",
  env: process.env,
});

const shutdown = () => {
  server.kill();
  client.kill();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const serverExit = await server.exited;
const clientExit = await client.exited;
process.exit(serverExit || clientExit);
