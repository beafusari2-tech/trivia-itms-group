import { v4 as uuidv4 } from "uuid";
import { db, runInTransaction } from "../db";
import { ParticipantRow } from "../types";
import { AppError } from "../utils/AppError";

export interface RegisterParticipantInput {
  name: string;
  institution: string;
  phone: string;
  email: string;
  consent: boolean;
  marketingConsent: boolean;
}

/**
 * Cadastra um novo participante ou atualiza os dados de um participante já
 * existente com o mesmo e-mail (evita duplicidade quando alguém escaneia o
 * QR Code novamente durante o evento).
 */
export function registerOrUpdateParticipant(input: RegisterParticipantInput): ParticipantRow {
  const email = input.email.toLowerCase();
  const existing = db
    .prepare("SELECT * FROM participants WHERE email = ?")
    .get(email) as ParticipantRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE participants SET name = ?, institution = ?, phone = ?, consent = ?, marketing_consent = ? WHERE id = ?`
    ).run(
      input.name,
      input.institution,
      input.phone,
      input.consent ? 1 : 0,
      input.marketingConsent ? 1 : 0,
      existing.id
    );
    return db.prepare("SELECT * FROM participants WHERE id = ?").get(existing.id) as unknown as ParticipantRow;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO participants (id, name, institution, phone, email, consent, marketing_consent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.institution,
    input.phone,
    email,
    input.consent ? 1 : 0,
    input.marketingConsent ? 1 : 0
  );

  return db.prepare("SELECT * FROM participants WHERE id = ?").get(id) as unknown as ParticipantRow;
}

export function getParticipantById(id: string): ParticipantRow | undefined {
  return db.prepare("SELECT * FROM participants WHERE id = ?").get(id) as ParticipantRow | undefined;
}

/**
 * Exclusão de dados pessoais a pedido do titular (LGPD art. 18). Remove o
 * participante e todo histórico de jogo associado (sessões e respostas),
 * já que manter respostas/pontuação vinculadas a alguém que pediu exclusão
 * ainda seria manter dado pessoal indiretamente identificável.
 */
export function deleteParticipant(id: string): void {
  const existing = getParticipantById(id);
  if (!existing) throw new AppError("Participante não encontrado.", 404);

  runInTransaction(() => {
    const sessions = db
      .prepare("SELECT id FROM game_sessions WHERE participant_id = ?")
      .all(id) as { id: string }[];

    const deleteAnswers = db.prepare("DELETE FROM game_answers WHERE session_id = ?");
    for (const session of sessions) {
      deleteAnswers.run(session.id);
    }

    db.prepare("DELETE FROM game_sessions WHERE participant_id = ?").run(id);
    db.prepare("DELETE FROM participants WHERE id = ?").run(id);
  });
}
