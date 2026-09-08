import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { ApiError, getSessionSummary } from "../lib/api";
import { fireConfetti } from "../lib/confetti";
import { GameSummary } from "../lib/types";
import { CATEGORY_TITLES } from "../lib/categoryMeta";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { sessionId?: string } | null;
    const sessionId = state?.sessionId;
    if (!sessionId) {
      navigate("/categorias");
      return;
    }

    getSessionSummary(sessionId)
      .then((data) => {
        setSummary(data);
        if (data.percentage >= 70) fireConfetti();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/cadastro");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar o resultado.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="glass-card max-w-md rounded-3xl p-8 text-center">
          <p className="text-accent-dark">{error}</p>
          <button className="btn-secondary mt-6" onClick={() => navigate("/categorias")}>
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  if (!summary) {
    return (
      <Layout>
        <p className="text-ink/60">Calculando seu resultado...</p>
      </Layout>
    );
  }

  const seconds = Math.round(summary.totalTimeMs / 1000);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-lg rounded-3xl p-8 text-center sm:p-10"
      >
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-2xl font-extrabold text-ink sm:text-3xl">TRIVIA CONCLUÍDA!</h1>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink/50">
          {CATEGORY_TITLES[summary.category]}
        </p>

        <p className="mt-6 text-4xl font-extrabold text-accent">
          {summary.score.toLocaleString("pt-BR")} pontos
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-white/40 p-3">
            <p className="text-lg font-bold text-ink">
              {summary.correctCount}/{summary.totalQuestions}
            </p>
            <p className="text-ink/50">Acertos</p>
          </div>
          <div className="rounded-2xl bg-white/40 p-3">
            <p className="text-lg font-bold text-ink">{summary.percentage}%</p>
            <p className="text-ink/50">Aproveitamento</p>
          </div>
          <div className="rounded-2xl bg-white/40 p-3">
            <p className="text-lg font-bold text-ink">{seconds}s</p>
            <p className="text-ink/50">Tempo total</p>
          </div>
        </div>

        <p className="mt-6 text-lg font-semibold text-ink">{summary.message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="btn-primary flex-1" onClick={() => navigate("/categorias")}>
            JOGAR OUTRA CATEGORIA
          </button>
          <button className="btn-secondary flex-1" onClick={() => navigate("/ranking")}>
            VER RANKING 🏆
          </button>
        </div>
      </motion.div>
    </Layout>
  );
}
