import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getRanking } from "../lib/api";
import { CategoryId, RankingEntry } from "../lib/types";
import { CATEGORY_TITLES } from "../lib/categoryMeta";

const FILTERS: { id: CategoryId | "geral"; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "catalogacao", label: "Catalogação" },
  { id: "educacao", label: "Educação" },
  { id: "ia_plagio", label: "IA, Plágio e Escrita" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const [filter, setFilter] = useState<CategoryId | "geral">("geral");
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRanking(filter === "geral" ? undefined : filter)
      .then((data) => setEntries(data.ranking))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <Layout>
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-2xl font-extrabold text-ink sm:text-4xl">
          Ranking do Evento 🏆
        </h1>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f.id
                  ? "bg-gradient-to-r from-accent to-accent-dark text-white"
                  : "bg-white/40 text-ink/60 hover:bg-white/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {loading && <p className="text-center text-ink/50">Carregando ranking...</p>}

          {!loading && entries.length === 0 && (
            <p className="text-center text-ink/50">
              Ainda não há partidas concluídas nesta categoria. Seja o primeiro! 🚀
            </p>
          )}

          {entries.map((entry, index) => (
            <div
              key={`${entry.name}-${entry.institution}-${index}`}
              className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4"
            >
              <span className="w-8 text-center text-2xl">{MEDALS[index] || `${index + 1}º`}</span>
              <div className="flex-1">
                <p className="font-bold text-ink">{entry.name}</p>
                <p className="text-xs text-ink/50">
                  {entry.institution}
                  {filter === "geral" && ` · ${CATEGORY_TITLES[entry.category]}`}
                </p>
              </div>
              <span className="font-extrabold text-accent">
                {entry.score.toLocaleString("pt-BR")} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
