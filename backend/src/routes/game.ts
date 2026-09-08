import { Router } from "express";
import { AuthedRequest, requireParticipant } from "../middleware/auth";
import { startGameSchema, submitAnswerSchema } from "../utils/validation";
import { getCurrentQuestion, getSessionSummary, startGame, submitAnswer } from "../services/gameService";
import { gameLimiter } from "../middleware/rateLimiters";

export const gameRouter = Router();

gameRouter.use(gameLimiter, requireParticipant);

gameRouter.post("/start", (req: AuthedRequest, res, next) => {
  try {
    const { category } = startGameSchema.parse(req.body);
    const result = startGame(req.participantId!, category);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

gameRouter.get("/:sessionId/question", (req: AuthedRequest, res, next) => {
  try {
    const result = getCurrentQuestion(req.params.sessionId, req.participantId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

gameRouter.post("/:sessionId/answer", (req: AuthedRequest, res, next) => {
  try {
    const { questionId, selectedOption, timeTakenMs } = submitAnswerSchema.parse(req.body);
    const result = submitAnswer(req.params.sessionId, req.participantId!, questionId, selectedOption, timeTakenMs);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

gameRouter.get("/:sessionId/summary", (req: AuthedRequest, res, next) => {
  try {
    const summary = getSessionSummary(req.params.sessionId, req.participantId!);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
