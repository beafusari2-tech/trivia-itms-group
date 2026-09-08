import { Router } from "express";
import { z } from "zod";
import { adminLoginSchema, adminParticipantsQuerySchema } from "../utils/validation";
import {
  listAllParticipantSessionsForExport,
  listParticipantSessions,
  verifyAdminCredentials,
} from "../services/adminService";
import { deleteParticipant } from "../services/participantService";
import { signAdminToken } from "../utils/token";
import { adminLoginLimiter } from "../middleware/rateLimiters";
import { AuthedRequest, requireAdmin } from "../middleware/auth";
import { buildCsv, buildXlsx, ParticipantExportRow } from "../utils/export";
import { CATEGORY_LABELS, CategoryId } from "../types";

export const adminRouter = Router();

adminRouter.post("/login", adminLoginLimiter, (req, res, next) => {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);
    const admin = verifyAdminCredentials(username, password);
    const token = signAdminToken({ adminId: admin.id, username: admin.username });
    res.json({ token, username: admin.username });
  } catch (err) {
    next(err);
  }
});

adminRouter.use(requireAdmin);

adminRouter.get("/participants", (req: AuthedRequest, res, next) => {
  try {
    const { search, category, page, pageSize } = adminParticipantsQuerySchema.parse(req.query);
    const { rows, total } = listParticipantSessions({ search, category, page, pageSize });
    res.json({ rows, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

const participantIdParamSchema = z.object({ id: z.string().uuid() });

// Exclusão de dados pessoais a pedido do titular (LGPD art. 18). Remove o
// participante e todo o histórico de jogo associado.
adminRouter.delete("/participants/:id", (req: AuthedRequest, res, next) => {
  try {
    const { id } = participantIdParamSchema.parse(req.params);
    deleteParticipant(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function toExportRows(rows: ReturnType<typeof listAllParticipantSessionsForExport>): ParticipantExportRow[] {
  return rows.map((r) => ({
    name: r.name,
    institution: r.institution,
    phone: r.phone,
    email: r.email,
    category: CATEGORY_LABELS[r.category as CategoryId]?.title || r.category,
    score: r.score,
    correctAnswers: r.correctCount,
    questionsAnswered: r.answeredCount,
    totalTimeSeconds: r.totalTimeMs ? Math.round(r.totalTimeMs / 1000) : 0,
    status: r.status,
    createdAt: r.startedAt,
  }));
}

adminRouter.get("/export.csv", (req: AuthedRequest, res, next) => {
  try {
    const { search, category } = adminParticipantsQuerySchema.parse(req.query);
    const rows = listAllParticipantSessionsForExport({ search, category });
    const csv = buildCsv(toExportRows(rows));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="participantes-trivia-itms.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/export.xlsx", async (req: AuthedRequest, res, next) => {
  try {
    const { search, category } = adminParticipantsQuerySchema.parse(req.query);
    const rows = listAllParticipantSessionsForExport({ search, category });
    const buffer = await buildXlsx(toExportRows(rows));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="participantes-trivia-itms.xlsx"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
