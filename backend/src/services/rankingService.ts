import { db } from "../db";
import { CategoryId } from "../types";

export interface RankingEntry {
  name: string;
  institution: string;
  score: number;
  category: CategoryId;
}

/**
 * Ranking com a melhor partida concluída de cada participante (evita que
 * jogar várias vezes infle artificialmente a lista). Telefone e e-mail nunca
 * são retornados aqui.
 */
export function getRanking(category: CategoryId | undefined, limit: number): RankingEntry[] {
  const rows = db
    .prepare(
      `
      SELECT p.name AS name, p.institution AS institution, best.score AS score, best.category AS category
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY participant_id ORDER BY score DESC, total_time_ms ASC) AS rn
        FROM game_sessions
        WHERE status = 'completed' AND (@category IS NULL OR category = @category)
      ) AS best
      JOIN participants p ON p.id = best.participant_id
      WHERE best.rn = 1
      ORDER BY best.score DESC, best.total_time_ms ASC
      LIMIT @limit
      `
    )
    .all({ category: category ?? null, limit }) as unknown as RankingEntry[];

  return rows;
}
