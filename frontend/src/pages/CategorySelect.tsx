import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CategoryCard from "../components/CategoryCard";
import { ApiError, getCategories, startGame } from "../lib/api";
import { getParticipant, getParticipantToken } from "../lib/storage";
import { Category, CategoryId } from "../lib/types";

export default function CategorySelect() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingCategory, setStartingCategory] = useState<CategoryId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const participant = getParticipant();

  useEffect(() => {
    if (!getParticipantToken()) {
      navigate("/cadastro");
      return;
    }
    getCategories()
      .then((data) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleSelect(categoryId: CategoryId) {
    if (startingCategory) return;
    setError(null);
    setStartingCategory(categoryId);
    try {
      const { sessionId, firstQuestion } = await startGame(categoryId);
      navigate(`/trivia/${categoryId}`, { state: { sessionId, firstQuestion } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // api.ts já limpou o cadastro salvo (token inválido/expirado) —
        // manda de volta pro formulário em vez de deixar preso num erro.
        navigate("/cadastro");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar o jogo.");
      setStartingCategory(null);
    }
  }

  return (
    <Layout>
      <div className="w-full max-w-5xl text-center">
        <h1 className="text-2xl font-extrabold text-ink sm:text-4xl">
          {participant ? `Olá, ${participant.name.split(" ")[0]}!` : "Escolha sua categoria"}
        </h1>
        <p className="mt-2 text-ink/60">Escolha uma categoria para começar a jogar.</p>

        {error && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-ink/50">Carregando categorias...</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelect={handleSelect}
                loading={startingCategory === cat.id}
                disabled={startingCategory !== null}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
