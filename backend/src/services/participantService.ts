import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { ParticipantRow } from "../types";

export interface RegisterParticipantInput {
  name: string;
  institution: string;
  phone: string;
  email: string;
  consent: boolean;
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
      `UPDATE participants SET name = ?, institution = ?, phone = ?, consent = ? WHERE id = ?`
    ).run(input.name, input.institution, input.phone, input.consent ? 1 : 0, existing.id);
    return db.prepare("SELECT * FROM participants WHERE id = ?").get(existing.id) as unknown as ParticipantRow;
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO participants (id, name, institution, phone, email, consent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.institution, input.phone, email, input.consent ? 1 : 0);

  return db.prepare("SELECT * FROM participants WHERE id = ?").get(id) as unknown as ParticipantRow;
}

export function getParticipantById(id: string): ParticipantRow | undefined {
  return db.prepare("SELECT * FROM participants WHERE id = ?").get(id) as ParticipantRow | undefined;
}
