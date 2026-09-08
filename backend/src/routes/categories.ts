import { Router } from "express";
import { CATEGORY_LABELS } from "../types";
import { publicReadLimiter } from "../middleware/rateLimiters";

export const categoriesRouter = Router();

categoriesRouter.get("/", publicReadLimiter, (_req, res) => {
  const categories = Object.entries(CATEGORY_LABELS).map(([id, meta]) => ({
    id,
    title: meta.title,
    tagline: meta.tagline,
  }));
  res.json({ categories });
});
