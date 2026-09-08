import express from "express";
import cors from "cors";
import helmet from "helmet";
import { participantsRouter } from "./routes/participants";
import { categoriesRouter } from "./routes/categories";
import { gameRouter } from "./routes/game";
import { rankingRouter } from "./routes/ranking";
import { adminRouter } from "./routes/admin";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: FRONTEND_ORIGIN.split(",").map((o) => o.trim()),
      credentials: false,
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/participants", participantsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/game", gameRouter);
  app.use("/api/ranking", rankingRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
