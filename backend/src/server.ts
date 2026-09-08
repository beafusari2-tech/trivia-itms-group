import dotenv from "dotenv";
dotenv.config();

import { initSchema } from "./db";
import { seedQuestions } from "./db/seedQuestions";
import { ensureDefaultAdmin } from "./services/adminService";
import { createApp } from "./app";

// Sem fallback para usuário/senha do admin: já tivemos um incidente real em
// que a variável ADMIN_PASSWORD sumiu da configuração de deploy e a aplicação
// subiu silenciosamente com uma senha padrão previsível. Preferimos recusar
// o boot a rodar em produção com uma credencial conhecida.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "[server] ADMIN_USERNAME e ADMIN_PASSWORD são obrigatórios — configure-os no ambiente antes de iniciar."
  );
}

initSchema();
seedQuestions();
ensureDefaultAdmin(ADMIN_USERNAME, ADMIN_PASSWORD);

const app = createApp();
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`[server] Trivia ITMS Group backend rodando na porta ${PORT}`);
});
