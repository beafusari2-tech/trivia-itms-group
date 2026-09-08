import { Router } from "express";
import { registerParticipantSchema } from "../utils/validation";
import { registerOrUpdateParticipant } from "../services/participantService";
import { signParticipantToken } from "../utils/token";
import { registerLimiter } from "../middleware/rateLimiters";

export const participantsRouter = Router();

participantsRouter.post("/", registerLimiter, (req, res, next) => {
  try {
    const data = registerParticipantSchema.parse(req.body);
    const participant = registerOrUpdateParticipant(data);
    const token = signParticipantToken({ participantId: participant.id });
    res.status(201).json({
      token,
      participant: {
        id: participant.id,
        name: participant.name,
        institution: participant.institution,
        email: participant.email,
      },
    });
  } catch (err) {
    next(err);
  }
});
