import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import ScoreBadge from "../components/ScoreBadge";
import QuestionCard from "../components/QuestionCard";
import { ApiError, getCurrentQuestion, startGame, submitAnswer } from "../lib/api";
import { getParticipantToken } from "../lib/storage";
import { fireBurst } from "../lib/confetti";
import { AnswerResult, CategoryId, OptionLetter, PublicQuestion } from "../lib/types";

const VALID_CATEGORIES: CategoryId[] = ["catalogacao", "educacao", "ia_plagio"];

export default function Trivia() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<OptionLetter | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionStartRef = useRef<number>(Date.now());

  // Cadastro salvo no navegador ficou inválido (token expirado, ou apontando
  // para um participante que não existe mais no banco) — manda de volta pro
  // formulário em vez de deixar preso numa tela de erro genérico.
  const handleApiError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/cadastro");
        return;
      }
      setError(err instanceof ApiError ? err.message : fallbackMessage);
    },
    [navigate]
  );

  useEffect(() => {
    if (!getParticipantToken()) {
      navigate("/cadastro");
      return;
    }
    if (!category || !VALID_CATEGORIES.includes(category as CategoryId)) {
      navigate("/categorias");
      return;
    }

    // O jogo normalmente já é iniciado pelo clique no card de categoria
    // (CategorySelect), que passa sessionId/firstQuestion via state — assim
    // evitamos criar a sessão dentro de um efeito (o StrictMode do React
    // invoca efeitos duas vezes em dev, o que criaria uma sessão duplicada).
    const navState = location.state as { sessionId?: string; firstQuestion?: PublicQuestion } | null;
    if (navState?.sessionId && navState.firstQuestion) {
      setSessionId(navState.sessionId);
      setQuestion(navState.firstQuestion);
      questionStartRef.current = Date.now();
      setLoading(false);
      return;
    }

    // Fallback para acesso direto pela URL (ex: recarregar a página).
    let cancelled = false;
    setLoading(true);
    startGame(category as CategoryId)
      .then((data) => {
        if (cancelled) return;
        setSessionId(data.sessionId);
        setQuestion(data.firstQuestion);
        questionStartRef.current = Date.now();
      })
      .catch((err) => {
        if (cancelled) return;
        handleApiError(err, "Não foi possível iniciar o jogo.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSelect = useCallback(
    async (letter: OptionLetter) => {
      if (!sessionId || !question || submitting || result) return;
      setSelectedOption(letter);
      setSubmitting(true);
      const timeTakenMs = Date.now() - questionStartRef.current;

      try {
        const res = await submitAnswer(sessionId, question.questionId, letter, timeTakenMs);
        setResult(res);
        setScore(res.totalScore);
        if (res.correct) fireBurst();
      } catch (err) {
        handleApiError(err, "Não foi possível enviar sua resposta.");
      } finally {
        setSubmitting(false);
      }
    },
    [sessionId, question, submitting, result, handleApiError]
  );

  async function handleContinue() {
    if (!sessionId || !result) return;

    if (result.isLastQuestion) {
      navigate("/resultado", { state: { sessionId } });
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedOption(null);
    try {
      const next = await getCurrentQuestion(sessionId);
      if ("finished" in next) {
        navigate("/resultado", { state: { sessionId } });
        return;
      }
      setQuestion(next);
      questionStartRef.current = Date.now();
    } catch (err) {
      handleApiError(err, "Não foi possível carregar a próxima pergunta.");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <Layout>
        <div className="glass-card max-w-md rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold text-accent-dark">{error}</p>
          <button className="btn-secondary mt-6" onClick={() => navigate("/categorias")}>
            Voltar para categorias
          </button>
        </div>
      </Layout>
    );
  }

  if (loading || !question) {
    return (
      <Layout>
        <p className="text-ink/60">Carregando pergunta...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between">
          <ProgressBar current={question.index} total={question.total} />
        </div>
        <ScoreBadge score={score} />

        <AnimatePresence mode="wait">
          <QuestionCard
            key={question.questionId}
            question={question}
            selectedOption={selectedOption}
            correctAnswer={result ? result.correctAnswer : null}
            onSelect={handleSelect}
            disabled={submitting || result !== null}
          />
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`glass-card w-full max-w-2xl rounded-3xl border p-6 text-center ${
                result.correct ? "border-emerald-500/50" : "border-accent/50"
              }`}
            >
              <p className={`text-xl font-extrabold ${result.correct ? "text-emerald-700" : "text-accent-dark"}`}>
                {result.correct ? "CORRETO! 🎉" : "NÃO FOI DESSA VEZ!"}
              </p>
              {result.correct && (
                <p className="mt-1 text-sm font-semibold text-ink/70">
                  +{result.pointsEarned} pontos
                </p>
              )}
              <p className="mt-3 text-sm text-ink/70">{result.explanation}</p>
              <button className="btn-primary mt-6" onClick={handleContinue}>
                {result.isLastQuestion ? "VER RESULTADO" : "PRÓXIMA PERGUNTA"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
