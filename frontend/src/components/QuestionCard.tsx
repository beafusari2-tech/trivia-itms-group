import { motion } from "framer-motion";
import { OptionLetter, PublicQuestion } from "../lib/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

interface Props {
  question: PublicQuestion;
  selectedOption: OptionLetter | null;
  correctAnswer: OptionLetter | null;
  onSelect: (letter: OptionLetter) => void;
  disabled: boolean;
}

export default function QuestionCard({ question, selectedOption, correctAnswer, onSelect, disabled }: Props) {
  return (
    <motion.div
      key={question.questionId}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
      className="glass-card w-full max-w-2xl rounded-3xl p-6 sm:p-8"
    >
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink/50">
        <span>{DIFFICULTY_LABEL[question.difficulty] || question.difficulty}</span>
        <span>{question.points} pts base</span>
      </div>

      <h2 className="mb-6 text-xl font-bold leading-snug text-ink sm:text-2xl">
        {question.question}
      </h2>

      <div className="grid gap-3">
        {question.options.map((opt) => {
          const isSelected = selectedOption === opt.letter;
          const isCorrectOpt = correctAnswer === opt.letter;
          const showResult = correctAnswer !== null;

          let stateClasses = "border-ink/15 bg-white/40 hover:bg-white/70";
          if (showResult && isCorrectOpt) {
            stateClasses = "border-emerald-500 bg-emerald-500/20";
          } else if (showResult && isSelected && !isCorrectOpt) {
            stateClasses = "border-accent bg-accent/15";
          } else if (isSelected) {
            stateClasses = "border-accent bg-accent/10";
          }

          return (
            <button
              key={opt.letter}
              disabled={disabled}
              onClick={() => onSelect(opt.letter)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left font-medium text-ink transition disabled:cursor-not-allowed ${stateClasses}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-bold">
                {opt.letter}
              </span>
              <span>{opt.text}</span>
              {showResult && isCorrectOpt && <span className="ml-auto">✅</span>}
              {showResult && isSelected && !isCorrectOpt && <span className="ml-auto">❌</span>}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
