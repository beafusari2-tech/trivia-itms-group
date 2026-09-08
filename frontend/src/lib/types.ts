export type CategoryId = "catalogacao" | "educacao" | "ia_plagio";
export type OptionLetter = "A" | "B" | "C" | "D";

export interface Category {
  id: CategoryId;
  title: string;
  tagline: string;
}

export interface Participant {
  id: string;
  name: string;
  institution: string;
  email: string;
}

export interface PublicQuestion {
  questionId: string;
  index: number;
  total: number;
  question: string;
  options: { letter: OptionLetter; text: string }[];
  difficulty: "easy" | "medium" | "hard";
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

export interface RankingEntry {
  name: string;
  institution: string;
  score: number;
  category: CategoryId;
}

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
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
}
