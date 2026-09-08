import fs from "fs";
import path from "path";
import { db, runInTransaction } from "./index";
import { QuestionSeed } from "../types";

const QUESTIONS_DIR = path.join(__dirname, "..", "data", "questions");

/**
 * Loads every *.json file in src/data/questions and (re)syncs the `questions`
 * table from them. The JSON files are the source of truth for question
 * content, so the team can add/edit/remove questions without touching code.
 */
export function seedQuestions(): void {
  const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith(".json"));

  const allQuestions: QuestionSeed[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(QUESTIONS_DIR, file), "utf-8");
    const parsed = JSON.parse(raw) as QuestionSeed[];
    allQuestions.push(...parsed);
  }

  const upsert = db.prepare(`
    INSERT INTO questions (id, category, question, option_a, option_b, option_c, option_d, correct_answer, difficulty, points, explanation)
    VALUES (@id, @category, @question, @option_a, @option_b, @option_c, @option_d, @correct_answer, @difficulty, @points, @explanation)
    ON CONFLICT(id) DO UPDATE SET
      category = excluded.category,
      question = excluded.question,
      option_a = excluded.option_a,
      option_b = excluded.option_b,
      option_c = excluded.option_c,
      option_d = excluded.option_d,
      correct_answer = excluded.correct_answer,
      difficulty = excluded.difficulty,
      points = excluded.points,
      explanation = excluded.explanation
  `);

  const validIds = new Set(allQuestions.map((q) => q.id));

  runInTransaction(() => {
    for (const q of allQuestions) {
      upsert.run({
        id: q.id,
        category: q.category,
        question: q.question,
        option_a: q.options[0],
        option_b: q.options[1],
        option_c: q.options[2],
        option_d: q.options[3],
        correct_answer: q.correctAnswer,
        difficulty: q.difficulty,
        points: q.points,
        explanation: q.explanation,
      });
    }

    // Remove questions that no longer exist in the JSON files.
    const existingIds = db.prepare("SELECT id FROM questions").all() as { id: string }[];
    const deleteStmt = db.prepare("DELETE FROM questions WHERE id = ?");
    for (const row of existingIds) {
      if (!validIds.has(row.id)) {
        deleteStmt.run(row.id);
      }
    }
  });

  console.log(`[seedQuestions] ${allQuestions.length} perguntas sincronizadas no banco de dados.`);
}
