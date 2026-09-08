// Script utilitário para criar ou redefinir a senha de um administrador.
// Uso: npm run seed:admin -- <usuario> <senha>
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { initSchema, db } from "../db";

initSchema();

const username = process.argv[2] || process.env.ADMIN_USERNAME || "admin";
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("Informe a senha: npm run seed:admin -- <usuario> <senha>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(username) as
  | { id: string }
  | undefined;

if (existing) {
  db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(hash, existing.id);
  console.log(`Senha atualizada para o administrador "${username}".`);
} else {
  db.prepare("INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)").run(
    uuidv4(),
    username,
    hash
  );
  console.log(`Administrador "${username}" criado com sucesso.`);
}
