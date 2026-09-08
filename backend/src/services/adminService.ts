import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { AdminRow, CategoryId, SessionStatus } from "../types";
import { AppError } from "../utils/AppError";

export interface AdminSessionRow {
  sessionId: string;
  participantId: string;
  name: string;
  institution: string;
  phone: string;
  email: string;
  category: CategoryId;
  score: number;
  correctCount: number;
  answeredCount: number;
  totalTimeMs: number | null;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface ListFilters {
  search?: string;
  category?: CategoryId;
  page: number;
  pageSize: number;
}

function buildWhereClause(filters: Pick<ListFilters, "search" | "category">) {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters.search) {
    clauses.push(
      "(p.name LIKE @search OR p.institution LIKE @search OR p.email LIKE @search OR p.phone LIKE @search)"
    );
    params.search = `%${filters.search}%`;
  }

  if (filters.category) {
    clauses.push("gs.category = @category");
    params.category = filters.category;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

export function listParticipantSessions(filters: ListFilters): { rows: AdminSessionRow[]; total: number } {
  const { where, params } = buildWhereClause(filters);
  const offset = (filters.page - 1) * filters.pageSize;

  const rows = db
    .prepare(
      `
      SELECT
        gs.id AS sessionId,
        p.id AS participantId,
        p.name AS name,
        p.institution AS institution,
        p.phone AS phone,
        p.email AS email,
        gs.category AS category,
        gs.score AS score,
        gs.correct_count AS correctCount,
        gs.answered_count AS answeredCount,
        gs.total_time_ms AS totalTimeMs,
        gs.status AS status,
        gs.started_at AS startedAt,
        gs.completed_at AS completedAt
      FROM game_sessions gs
      JOIN participants p ON p.id = gs.participant_id
      ${where}
      ORDER BY gs.started_at DESC
      LIMIT @pageSize OFFSET @offset
      `
    )
    .all({ ...params, pageSize: filters.pageSize, offset }) as unknown as AdminSessionRow[];

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS count FROM game_sessions gs JOIN participants p ON p.id = gs.participant_id ${where}`
    )
    .get(params) as { count: number };

  return { rows, total: totalRow.count };
}

export function listAllParticipantSessionsForExport(
  filters: Pick<ListFilters, "search" | "category">
): AdminSessionRow[] {
  const { where, params } = buildWhereClause(filters);

  return db
    .prepare(
      `
      SELECT
        gs.id AS sessionId,
        p.id AS participantId,
        p.name AS name,
        p.institution AS institution,
        p.phone AS phone,
        p.email AS email,
        gs.category AS category,
        gs.score AS score,
        gs.correct_count AS correctCount,
        gs.answered_count AS answeredCount,
        gs.total_time_ms AS totalTimeMs,
        gs.status AS status,
        gs.started_at AS startedAt,
        gs.completed_at AS completedAt
      FROM game_sessions gs
      JOIN participants p ON p.id = gs.participant_id
      ${where}
      ORDER BY gs.started_at DESC
      `
    )
    .all(params) as unknown as AdminSessionRow[];
}

export function verifyAdminCredentials(username: string, password: string): AdminRow {
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as
    | AdminRow
    | undefined;
  if (!admin) throw new AppError("Usuário ou senha inválidos.", 401);

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) throw new AppError("Usuário ou senha inválidos.", 401);

  return admin;
}

export function ensureDefaultAdmin(username: string, password: string): void {
  const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 12);
  db.prepare("INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)").run(
    uuidv4(),
    username,
    hash
  );
  console.log(`[adminService] Administrador padrão criado: ${username}`);
}
