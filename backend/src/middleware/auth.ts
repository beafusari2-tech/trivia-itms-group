import { NextFunction, Request, Response } from "express";
import { verifyAdminToken, verifyParticipantToken } from "../utils/token";
import { getParticipantById } from "../services/participantService";

export interface AuthedRequest extends Request {
  participantId?: string;
  adminId?: string;
  adminUsername?: string;
}

export function requireParticipant(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de participante ausente." });
    return;
  }
  try {
    const payload = verifyParticipantToken(header.slice(7));
    // O token pode ser válido (assinatura ok) mas apontar para um
    // participante que não existe mais (ex: banco de dados recriado).
    // Sem essa checagem, tentar criar uma sessão de jogo para esse id
    // quebra com FOREIGN KEY constraint e vira um 500 confuso pro usuário.
    if (!getParticipantById(payload.participantId)) {
      res.status(401).json({ error: "Cadastro não encontrado. Faça o cadastro novamente para continuar." });
      return;
    }
    req.participantId = payload.participantId;
    next();
  } catch {
    res.status(401).json({ error: "Token de participante inválido ou expirado." });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  try {
    const payload = verifyAdminToken(header.slice(7));
    req.adminId = payload.adminId;
    req.adminUsername = payload.username;
    next();
  } catch {
    res.status(401).json({ error: "Sessão de administrador inválida ou expirada." });
  }
}
