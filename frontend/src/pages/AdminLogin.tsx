import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminLogin, ApiError } from "../lib/api";
import { saveAdminToken } from "../lib/storage";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await adminLogin(username.trim(), password);
      saveAdminToken(token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="glass-card w-full max-w-sm rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold text-ink">Área administrativa</h1>
        <p className="mt-1 text-sm text-ink/60">Acesso restrito à equipe ITMS Group.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">Usuário</label>
            <input
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink/80">Senha</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Entrando..." : "ENTRAR"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
