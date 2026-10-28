import { app } from "./app";

const port = Number(process.env.API_PORT ?? 8787);

app.listen(port, "127.0.0.1", () => {
  console.log(`Lumin Sign Lab API on http://127.0.0.1:${port}`);
});
