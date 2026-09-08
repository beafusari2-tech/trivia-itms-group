import { Router } from "express";
import { z } from "zod";
import { getRanking } from "../services/rankingService";
import { publicReadLimiter } from "../middleware/rateLimiters";

export const rankingRouter = Router();

const rankingQuerySchema = z.object({
  category: z.enum(["catalogacao", "educacao", "ia_plagio"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

rankingRouter.get("/", publicReadLimiter, (req, res, next) => {
  try {
    const { category, limit } = rankingQuerySchema.parse(req.query);
    const ranking = getRanking(category, limit);
    res.json({ ranking });
  } catch (err) {
    next(err);
  }
});
