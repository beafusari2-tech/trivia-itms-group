import dotenv from "dotenv";
dotenv.config();

import { initSchema } from "./db";
import { seedQuestions } from "./db/seedQuestions";
import { ensureDefaultAdmin } from "./services/adminService";
import { createApp } from "./app";

initSchema();
seedQuestions();
ensureDefaultAdmin(
  process.env.ADMIN_USERNAME || "admin",
  process.env.ADMIN_PASSWORD || "troque-esta-senha"
);

const app = createApp();
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`[server] Trivia ITMS Group backend rodando na porta ${PORT}`);
});
