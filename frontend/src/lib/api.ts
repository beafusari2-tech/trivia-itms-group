import {
  AdminSessionRow,
  AnswerResult,
  Category,
  CategoryId,
  GameSummary,
  OptionLetter,
  Participant,
  PublicQuestion,
  RankingEntry,
} from "./types";
import { clearParticipantSession, getAdminToken, getParticipantToken } from "./storage";

const API_URL = (import.meta.env.VITE_API_URL as string) || "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: "participant" | "admin" } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth === "participant") {
    const token = getParticipantToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (options.auth === "admin") {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // resposta sem corpo JSON
    }
    // Token de participante inválido/expirado ou apontando para um cadastro
    // que não existe mais: limpa o que está salvo para que a próxima
    // navegação volte a pedir o cadastro em vez de repetir o mesmo erro.
    if (options.auth === "participant" && res.status === 401) {
      clearParticipantSession();
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function registerParticipant(input: {
  name: string;
  institution: string;
  phone: string;
  email: string;
  consent: boolean;
  marketingConsent: boolean;
}): Promise<{ token: string; participant: Participant }> {
  return request("/participants", { method: "POST", body: JSON.stringify(input) });
}

export function getCategories(): Promise<{ categories: Category[] }> {
  return request("/categories");
}

export function startGame(
  category: CategoryId
): Promise<{ sessionId: string; firstQuestion: PublicQuestion }> {
  return request("/game/start", {
    method: "POST",
    body: JSON.stringify({ category }),
    auth: "participant",
  });
}

export function getCurrentQuestion(
  sessionId: string
): Promise<PublicQuestion | { finished: true }> {
  return request(`/game/${sessionId}/question`, { auth: "participant" });
}

export function submitAnswer(
  sessionId: string,
  questionId: string,
  selectedOption: OptionLetter | null,
  timeTakenMs: number
): Promise<AnswerResult> {
  return request(`/game/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId, selectedOption, timeTakenMs }),
    auth: "participant",
  });
}

export function getSessionSummary(sessionId: string): Promise<GameSummary> {
  return request(`/game/${sessionId}/summary`, { auth: "participant" });
}

export function getRanking(category?: CategoryId): Promise<{ ranking: RankingEntry[] }> {
  const query = category ? `?category=${category}` : "";
  return request(`/ranking${query}`);
}

export function adminLogin(
  username: string,
  password: string
): Promise<{ token: string; username: string }> {
  return request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function adminGetParticipants(params: {
  search?: string;
  category?: CategoryId;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminSessionRow[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return request(`/admin/participants?${query.toString()}`, { auth: "admin" });
}

export function deleteParticipant(participantId: string): Promise<void> {
  return request(`/admin/participants/${participantId}`, { method: "DELETE", auth: "admin" });
}

export async function downloadAdminExport(
  format: "csv" | "xlsx",
  params: { search?: string; category?: CategoryId }
): Promise<void> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);

  const token = getAdminToken();
  const res = await fetch(`${API_URL}/admin/export.${format}?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new ApiError("Não foi possível gerar a exportação.", res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `participantes-trivia-itms.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
