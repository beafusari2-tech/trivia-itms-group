import jwt from "jsonwebtoken";
import { AdminTokenPayload, ParticipantTokenPayload } from "../types";

// Sem fallback: um segredo hardcoded no código-fonte deixa de proteger nada
// no momento em que o repositório existe. Se a env var faltar, é melhor a
// aplicação recusar subir do que rodar silenciosamente com um segredo
// previsível/público.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[token] Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

const PARTICIPANT_SECRET = requireEnv("JWT_PARTICIPANT_SECRET");
const ADMIN_SECRET = requireEnv("JWT_ADMIN_SECRET");

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
