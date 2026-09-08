export type CategoryId = "catalogacao" | "educacao" | "ia_plagio";

export type Difficulty = "easy" | "medium" | "hard";

export type OptionLetter = "A" | "B" | "C" | "D";

export interface QuestionSeed {
  id: string;
  category: CategoryId;
  question: string;
  options: [string, string, string, string];
  correctAnswer: OptionLetter;
  difficulty: Difficulty;
  points: number;
  explanation: string;
}

export interface QuestionRow {
  id: string;
  category: CategoryId;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: OptionLetter;
  difficulty: Difficulty;
  points: number;
  explanation: string;
}

export interface ParticipantRow {
  id: string;
  name: string;
  institution: string;
  phone: string;
  email: string;
  consent: number;
  created_at: string;
}

export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface GameSessionRow {
  id: string;
  participant_id: string;
  category: CategoryId;
  status: SessionStatus;
  question_ids: string;
  current_index: number;
  score: number;
  correct_count: number;
  answered_count: number;
  started_at: string;
  completed_at: string | null;
  total_time_ms: number | null;
}

export interface GameAnswerRow {
  id: number;
  session_id: string;
  question_id: string;
  selected_option: OptionLetter | null;
  correct: number;
  points_earned: number;
  time_taken_ms: number | null;
  answered_at: string;
}

export interface AdminRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface ParticipantTokenPayload {
  participantId: string;
}

export interface AdminTokenPayload {
  adminId: string;
  username: string;
}

export const CATEGORY_LABELS: Record<CategoryId, { title: string; tagline: string }> = {
  catalogacao: {
    title: "Catalogação",
    tagline: "Você entende de catalogação?",
  },
  educacao: {
    title: "Educação",
    tagline: "Você domina tecnologia educacional?",
  },
  ia_plagio: {
    title: "IA, Plágio e Escrita",
    tagline: "Você sabe diferenciar IA de plágio?",
  },
};
