import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { computePoints, resultMessage } from "./scoreService";
import { AppError } from "../utils/AppError";
import { CategoryId, GameSessionRow, OptionLetter, QuestionRow } from "../types";

export interface PublicQuestion {
  questionId: string;
  index: number;
  total: number;
  question: string;
  options: { letter: OptionLetter; text: string }[];
  difficulty: string;
  points: number;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: OptionLetter;
  explanation: string;
  pointsEarned: number;
  totalScore: number;
  isLastQuestion: boolean;
  summary?: GameSummary;
}

export interface GameSummary {
  sessionId: string;
  category: CategoryId;
  score: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  totalTimeMs: number;
  message: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toPublicQuestion(row: QuestionRow, index: number, total: number): PublicQuestion {
  return {
    questionId: row.id,
    index,
    total,
    question: row.question,
    options: [
      { letter: "A", text: row.option_a },
      { letter: "B", text: row.option_b },
      { letter: "C", text: row.option_c },
      { letter: "D", text: row.option_d },
    ],
    difficulty: row.difficulty,
    points: row.points,
  };
}

export function startGame(participantId: string, category: CategoryId): { sessionId: string; firstQuestion: PublicQuestion } {
  const questions = db
    .prepare("SELECT * FROM questions WHERE category = ?")
    .all(category) as unknown as QuestionRow[];

  if (questions.length === 0) {
    throw new AppError("Nenhuma pergunta cadastrada para esta categoria.");
  }

  const ordered = shuffle(questions);
  const sessionId = uuidv4();

  db.prepare(
    `INSERT INTO game_sessions (id, participant_id, category, status, question_ids, current_index, score, correct_count, answered_count)
     VALUES (?, ?, ?, 'in_progress', ?, 0, 0, 0, 0)`
  ).run(sessionId, participantId, category, JSON.stringify(ordered.map((q) => q.id)));

  return {
    sessionId,
    firstQuestion: toPublicQuestion(ordered[0], 0, ordered.length),
  };
}

function loadSession(sessionId: string, participantId: string): GameSessionRow {
  const session = db.prepare("SELECT * FROM game_sessions WHERE id = ?").get(sessionId) as
    | GameSessionRow
    | undefined;
  if (!session) throw new AppError("Sessão de jogo não encontrada.", 404);
  if (session.participant_id !== participantId) throw new AppError("Sessão não pertence a este participante.", 403);
  return session;
}

export function getCurrentQuestion(sessionId: string, participantId: string): PublicQuestion | { finished: true } {
  const session = loadSession(sessionId, participantId);
  const questionIds: string[] = JSON.parse(session.question_ids);

  if (session.status !== "in_progress" || session.current_index >= questionIds.length) {
    return { finished: true };
  }

  const questionId = questionIds[session.current_index];
  const row = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as unknown as QuestionRow;
  return toPublicQuestion(row, session.current_index, questionIds.length);
}

export function submitAnswer(
  sessionId: string,
  participantId: string,
  questionId: string,
  selectedOption: OptionLetter | null,
  timeTakenMs: number
): AnswerResult {
  const session = loadSession(sessionId, participantId);
  if (session.status !== "in_progress") {
    throw new AppError("Esta sessão de jogo já foi finalizada.");
  }

  const questionIds: string[] = JSON.parse(session.question_ids);
  const expectedQuestionId = questionIds[session.current_index];
  if (expectedQuestionId !== questionId) {
    throw new AppError("Pergunta fora de ordem ou já respondida.");
  }

  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as unknown as QuestionRow;
  const correct = selectedOption !== null && selectedOption === question.correct_answer;
  const pointsEarned = computePoints(question.points, correct, timeTakenMs);

  db.prepare(
    `INSERT INTO game_answers (session_id, question_id, selected_option, correct, points_earned, time_taken_ms)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(sessionId, questionId, selectedOption, correct ? 1 : 0, pointsEarned, timeTakenMs);

  const newIndex = session.current_index + 1;
  const newScore = session.score + pointsEarned;
  const newCorrectCount = session.correct_count + (correct ? 1 : 0);
  const newAnsweredCount = session.answered_count + 1;
  const isLastQuestion = newIndex >= questionIds.length;

  let summary: GameSummary | undefined;

  if (isLastQuestion) {
    const startedAtMs = new Date(session.started_at.replace(" ", "T") + "Z").getTime();
    const totalTimeMs = Math.max(0, Date.now() - startedAtMs);
    const percentage = Math.round((newCorrectCount / questionIds.length) * 100);

    db.prepare(
      `UPDATE game_sessions
       SET current_index = ?, score = ?, correct_count = ?, answered_count = ?,
           status = 'completed', completed_at = datetime('now'), total_time_ms = ?
       WHERE id = ?`
    ).run(newIndex, newScore, newCorrectCount, newAnsweredCount, totalTimeMs, sessionId);

    summary = {
      sessionId,
      category: session.category,
      score: newScore,
      correctCount: newCorrectCount,
      totalQuestions: questionIds.length,
      percentage,
      totalTimeMs,
      message: resultMessage(percentage),
    };
  } else {
    db.prepare(
      `UPDATE game_sessions
       SET current_index = ?, score = ?, correct_count = ?, answered_count = ?
       WHERE id = ?`
    ).run(newIndex, newScore, newCorrectCount, newAnsweredCount, sessionId);
  }

  return {
    correct,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    pointsEarned,
    totalScore: newScore,
    isLastQuestion,
    summary,
  };
}

export function getSessionSummary(sessionId: string, participantId: string): GameSummary {
  const session = loadSession(sessionId, participantId);
  if (session.status !== "completed") {
    throw new AppError("Esta sessão de jogo ainda não foi concluída.");
  }
  const questionIds: string[] = JSON.parse(session.question_ids);
  const percentage = Math.round((session.correct_count / questionIds.length) * 100);
  return {
    sessionId: session.id,
    category: session.category,
    score: session.score,
    correctCount: session.correct_count,
    totalQuestions: questionIds.length,
    totalTimeMs: session.total_time_ms || 0,
    percentage,
    message: resultMessage(percentage),
  };
}
