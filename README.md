# Trivia ITMS Group

Plataforma completa de Trivia para o evento da ITMS Group: cadastro de visitantes,
jogo com 3 categorias (Catalogação, Educação, IA/Plágio e Escrita), pontuação com
bônus de agilidade, ranking público e um painel administrativo protegido por login
com exportação para CSV/Excel.

> **Nota de ambiente:** esta máquina não tem Node.js instalado, então o código foi
> escrito e revisado, mas não pôde ser compilado/executado aqui. Siga o passo a
> passo abaixo — é o roteiro padrão para rodar o projeto em qualquer máquina com
> Node instalado.

---

## 1. Visão geral da stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion | SPA rápida, responsiva, fácil de estilizar (cards, gradientes, animações) e de manter. Vite dá build/dev instantâneos. |
| Backend | Node.js + Express + TypeScript | API REST simples, tipada, fácil de hospedar em qualquer provedor Node (Render, Railway, Fly.io, EC2, etc.). |
| Banco de dados | SQLite (via `better-sqlite3`) | Banco de dados **real e persistente**, em um único arquivo (`data/trivia.db`). Zero infraestrutura extra para o evento: não precisa de um servidor de banco separado, faz backup copiando um arquivo, e é rápido o suficiente para o volume de um evento presencial. Se no futuro o volume crescer muito ou for necessário multi-instância, a mesma camada de acesso (`src/db`) pode ser trocada por Postgres com poucas mudanças. |
| Autenticação admin | JWT (`jsonwebtoken`) + senha com hash `bcrypt` | Sem sessões em servidor, simples de escalar, senha nunca fica em texto puro. |
| Autenticação do participante | JWT "leve" emitido no cadastro | Permite ao participante jogar várias categorias sem preencher o formulário de novo, sem exigir login/senha (fricção zero, como pedido). |
| Exportação | `xlsx` (SheetJS) + geração manual de CSV | Exporta a mesma lista filtrada tanto em `.xlsx` quanto em `.csv`. |

---

## 2. Estrutura de pastas

```
Trivia Eveto/
├── backend/
│   ├── src/
│   │   ├── data/questions/*.json   # perguntas por categoria (edite aqui, sem tocar no código)
│   │   ├── db/                     # conexão SQLite, schema e seed das perguntas
│   │   ├── middleware/             # auth (JWT), rate limit, tratamento de erros
│   │   ├── routes/                 # endpoints da API
│   │   ├── services/               # regras de negócio (jogo, pontuação, ranking, admin)
│   │   ├── utils/                  # validação (zod), tokens, export CSV/XLSX
│   │   ├── app.ts / server.ts
│   │   └── scripts/seedAdmin.ts    # cria/redefine senha de administrador
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Landing, Register, CategorySelect, Trivia, Result, Ranking, Admin*
│   │   ├── components/             # Layout, cards, barra de progresso, etc.
│   │   └── lib/                    # cliente da API, tipos, localStorage
│   └── Dockerfile
└── docker-compose.yml
```

---

## 3. Rodando localmente

### Pré-requisitos
Instale o **Node.js 20 LTS** (inclui o npm): https://nodejs.org

### Backend

```powershell
cd backend
copy .env.example .env
# edite o .env e troque JWT_ADMIN_SECRET, JWT_PARTICIPANT_SECRET e ADMIN_PASSWORD
npm install
npm run dev
```

O servidor sobe em `http://localhost:4000`. No primeiro start ele:
1. cria o arquivo SQLite em `backend/data/trivia.db`;
2. sincroniza as perguntas dos arquivos JSON para o banco;
3. cria o usuário administrador padrão definido em `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

### Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Abre em `http://localhost:5173`. Em desenvolvimento, o Vite já faz proxy de
`/api` para `http://localhost:4000`, então não precisa configurar mais nada.

---

## 4. Como o admin acessa os dados

Acesse `http://localhost:5173/admin/login` (ou `/admin/login` no domínio de
produção) com o usuário/senha definidos no `.env` do backend
(`ADMIN_USERNAME` / `ADMIN_PASSWORD`). Depois do login você tem o painel em
`/admin`, com busca por nome/instituição/e-mail/telefone, filtro por
categoria, paginação e os botões **Exportar CSV** e **EXPORTAR PARA EXCEL**.

Para trocar a senha do admin depois do primeiro login, rode no backend:

```powershell
npm run seed:admin -- admin "nova-senha-forte"
```

---

## 5. Como adicionar, editar ou remover perguntas

As perguntas **não estão no código** — ficam em três arquivos JSON, um por
categoria, em `backend/src/data/questions/`:

- `catalogacao.json`
- `educacao.json`
- `ia_plagio.json`

Cada pergunta segue este formato:

```json
{
  "id": "cat-011",
  "category": "catalogacao",
  "question": "Pergunta aqui?",
  "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
  "correctAnswer": "B",
  "difficulty": "easy",
  "points": 100,
  "explanation": "Breve explicação exibida após a resposta."
}
```

Regras:
- `id` precisa ser único dentro do arquivo (e no projeto).
- `difficulty` é `"easy"` (100 pts), `"medium"` (200 pts) ou `"hard"` (300 pts).
- Basta editar o JSON e **reiniciar o backend** (`npm run dev` / `npm start`) —
  o `seedQuestions.ts` sincroniza automaticamente o banco com o conteúdo dos
  arquivos (inclusive removendo perguntas que forem apagadas do JSON).

---

## 6. Pontuação

- Fácil = 100 pts · Médio = 200 pts · Difícil = 300 pts.
- Bônus de agilidade: respostas **corretas** dadas em até 10 segundos ganham
  um bônus linear de até +50% dos pontos da pergunta (responder instantaneamente
  dá o bônus máximo; a partir de 10s o bônus é zero). Respostas erradas nunca
  pontuam. Fórmula em `backend/src/services/scoreService.ts`.
- Depois de confirmada, a resposta não pode ser alterada (o backend valida a
  ordem das perguntas e rejeita respostas fora de ordem ou duplicadas).

---

## 7. Segurança e LGPD

- Banco de dados SQLite não é exposto publicamente (fica apenas no servidor
  do backend).
- Painel `/admin` protegido por login com senha em hash (bcrypt) e JWT com
  expiração de 8h.
- Ranking público nunca mostra telefone ou e-mail.
- Cadastro exige o checkbox de consentimento explícito para uso dos dados.
- Rate limiting nos endpoints de cadastro, login admin e jogo (evita abuso).
- CORS restrito à origem do frontend (`FRONTEND_ORIGIN` no `.env`).
- Recomendado: habilitar HTTPS no domínio de produção (a maioria dos serviços
  de deploy abaixo já fornece isso automaticamente).

---

## 8. Deploy em cloud

### Opção simples (2 serviços gerenciados)
- **Backend**: Render, Railway ou Fly.io — suportam Node.js + disco persistente
  para o arquivo SQLite (`data/trivia.db`). Configure as variáveis de ambiente
  do `.env.example` no painel do serviço.
- **Frontend**: Vercel, Netlify ou Cloudflare Pages — build command
  `npm run build`, output `dist/`. Defina `VITE_API_URL` apontando para a URL
  pública do backend (ex.: `https://trivia-api.itmsgroup.com/api`).

### Opção com Docker (self-hosted / VPS)
Na raiz do projeto:

```powershell
copy .env.example .env   # crie um .env na raiz com JWT_ADMIN_SECRET, JWT_PARTICIPANT_SECRET, ADMIN_PASSWORD
docker compose up --build -d
```

Isso sobe o backend (porta 4000, com volume persistente para o SQLite) e o
frontend servido via Nginx (porta 5173). Ajuste `FRONTEND_ORIGIN` e
`VITE_API_URL` no `docker-compose.yml` para o domínio real antes de publicar.

---

## 9. QR Code do evento

Gere um QR Code apontando para a URL pública da landing page (`/`). O fluxo
já está pronto para isso:

```
QR Code → Landing (/) → Cadastro (/cadastro) → Categorias (/categorias)
        → Trivia (/trivia/:categoria) → Resultado (/resultado) → Ranking (/ranking)
```

---

## 10. Backup dos dados

O arquivo `backend/data/trivia.db` contém todos os participantes e partidas.
Basta copiá-lo periodicamente durante o evento para ter um backup rápido, além
de usar a exportação CSV/Excel do painel admin.
