import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminGetParticipants, downloadAdminExport, ApiError } from "../lib/api";
import { clearAdminToken, getAdminToken } from "../lib/storage";
import { AdminSessionRow, CategoryId } from "../lib/types";
import { CATEGORY_TITLES } from "../lib/categoryMeta";

const PAGE_SIZE = 25;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminSessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      setError(null);
      adminGetParticipants({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => {
          setRows(data.rows);
          setTotal(data.total);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            clearAdminToken();
            navigate("/admin/login");
            return;
          }
          setError("Não foi possível carregar os participantes.");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category, page, navigate]);

  async function handleExport(format: "csv" | "xlsx") {
    setExporting(format);
    try {
      await downloadAdminExport(format, { search: search || undefined, category: category || undefined });
    } catch {
      setError("Não foi possível gerar a exportação.");
    } finally {
      setExporting(null);
    }
  }

  function handleLogout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Layout>
      <div className="w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Painel Administrativo</h1>
          <button className="btn-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>

        <div className="glass-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <input
            className="input-field max-w-xs"
            placeholder="Buscar por nome, instituição, e-mail ou telefone"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="input-field max-w-[220px]"
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value as CategoryId | "");
            }}
          >
            <option value="">Todas as categorias</option>
            <option value="catalogacao">Catalogação</option>
            <option value="educacao">Educação</option>
            <option value="ia_plagio">IA, Plágio e Escrita</option>
          </select>

          <div className="ml-auto flex gap-2">
            <button
              className="btn-secondary"
              disabled={exporting !== null}
              onClick={() => handleExport("csv")}
            >
              {exporting === "csv" ? "Gerando..." : "Exportar CSV"}
            </button>
            <button
              className="btn-primary !px-5 !py-2.5 !text-sm"
              disabled={exporting !== null}
              onClick={() => handleExport("xlsx")}
            >
              {exporting === "xlsx" ? "Gerando..." : "EXPORTAR PARA EXCEL"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
            {error}
          </div>
        )}

        <div className="glass-card mt-4 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/50">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Instituição</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Pontuação</th>
                <th className="px-4 py-3">Acertos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink/50">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink/50">
                    Nenhum participante encontrado.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr key={row.sessionId} className="border-b border-ink/10 text-ink/80">
                    <td className="px-4 py-3 font-semibold text-ink">{row.name}</td>
                    <td className="px-4 py-3">{row.institution}</td>
                    <td className="px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{CATEGORY_TITLES[row.category]}</td>
                    <td className="px-4 py-3 font-bold text-accent">{row.score}</td>
                    <td className="px-4 py-3">
                      {row.correctCount}/{row.answeredCount}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.status.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      {new Date(row.startedAt.replace(" ", "T") + "Z").toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
          <span>{total} registro(s)</span>
          <div className="flex gap-2">
            <button
              className="btn-secondary !px-4 !py-2"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="flex items-center px-2">
              Página {page} de {totalPages}
            </span>
            <button
              className="btn-secondary !px-4 !py-2"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
