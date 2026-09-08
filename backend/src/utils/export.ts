// Usamos apenas XLSX.write / json_to_sheet para GERAR planilhas a partir dos
// nossos próprios dados. Nunca chamamos XLSX.read/readFile sobre arquivos de
// terceiros, que é a superfície afetada pelas CVEs conhecidas do SheetJS
// (prototype pollution / ReDoS no parser).
import * as XLSX from "xlsx";

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

function escapeCsvField(value: string | number): string {
  const str = String(value);
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

export function buildXlsx(rows: ParticipantExportRow[]): Buffer {
  const data = rows.map((r) => ({
    Nome: r.name,
    Instituição: r.institution,
    Telefone: r.phone,
    "E-mail": r.email,
    Categoria: r.category,
    Pontuação: r.score,
    Acertos: r.correctAnswers,
    "Perguntas Respondidas": r.questionsAnswered,
    "Tempo Total (s)": r.totalTimeSeconds,
    Status: r.status,
    "Data/Hora do Cadastro": r.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data, { header: HEADERS.map((h) => h) });
  // json_to_sheet infers headers from object keys already in the right order above.
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
