// exceljs gera a planilha inteiramente a partir dos nossos próprios dados
// (nunca abrimos um arquivo .xlsx de terceiros), então não há superfície de
// parsing de arquivo externo a proteger aqui.
import ExcelJS from "exceljs";

export interface ParticipantExportRow {
  name: string;
  institution: string;
  phone: string;
  email: string;
  category: string;
  score: number;
  correctAnswers: number;
  questionsAnswered: number;
  totalTimeSeconds: number;
  status: string;
  createdAt: string;
}

const HEADERS = [
  "Nome",
  "Instituição",
  "Telefone",
  "E-mail",
  "Categoria",
  "Pontuação",
  "Acertos",
  "Perguntas Respondidas",
  "Tempo Total (s)",
  "Status",
  "Data/Hora do Cadastro",
];

// CSV/Formula injection: um campo começando com =, +, - ou @ pode ser
// interpretado como fórmula pelo Excel ao abrir o arquivo (ex: telefone em
// formato internacional começa com "+"). Prefixar com aspas simples
// neutraliza sem alterar o valor visualmente para quem abre a planilha.
function neutralizeFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCsvField(value: string | number): string {
  const str = neutralizeFormula(String(value));
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows: ParticipantExportRow[]): string {
  const lines = [HEADERS.map(escapeCsvField).join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.name,
        r.institution,
        r.phone,
        r.email,
        r.category,
        r.score,
        r.correctAnswers,
        r.questionsAnswered,
        r.totalTimeSeconds,
        r.status,
        r.createdAt,
      ]
        .map(escapeCsvField)
        .join(";")
    );
  }
  // BOM para o Excel reconhecer UTF-8 corretamente (acentos em pt-BR).
  return "﻿" + lines.join("\r\n");
}

export async function buildXlsx(rows: ParticipantExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Participantes");

  sheet.columns = HEADERS.map((header) => ({ header, key: header }));

  for (const r of rows) {
    sheet.addRow({
      Nome: neutralizeFormula(r.name),
      Instituição: neutralizeFormula(r.institution),
      Telefone: neutralizeFormula(r.phone),
      "E-mail": neutralizeFormula(r.email),
      Categoria: r.category,
      Pontuação: r.score,
      Acertos: r.correctAnswers,
      "Perguntas Respondidas": r.questionsAnswered,
      "Tempo Total (s)": r.totalTimeSeconds,
      Status: r.status,
      "Data/Hora do Cadastro": r.createdAt,
    });
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
