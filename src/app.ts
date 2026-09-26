import express from "express";
import { notifyRouter } from "./routes/notify.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/notify", notifyRouter);
  return app;
}
