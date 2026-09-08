import jwt from "jsonwebtoken";
import { AdminTokenPayload, ParticipantTokenPayload } from "../types";

const PARTICIPANT_SECRET = process.env.JWT_PARTICIPANT_SECRET || "dev-participant-secret";
const ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "dev-admin-secret";

export function signParticipantToken(payload: ParticipantTokenPayload): string {
  return jwt.sign(payload, PARTICIPANT_SECRET, { expiresIn: "12h" });
}

export function verifyParticipantToken(token: string): ParticipantTokenPayload {
  return jwt.verify(token, PARTICIPANT_SECRET) as ParticipantTokenPayload;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, ADMIN_SECRET) as AdminTokenPayload;
}
