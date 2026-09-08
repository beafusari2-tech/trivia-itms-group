import { Participant } from "./types";

const PARTICIPANT_TOKEN_KEY = "trivia_participant_token";
const PARTICIPANT_DATA_KEY = "trivia_participant_data";
const ADMIN_TOKEN_KEY = "trivia_admin_token";

export function saveParticipantSession(token: string, participant: Participant): void {
  localStorage.setItem(PARTICIPANT_TOKEN_KEY, token);
  localStorage.setItem(PARTICIPANT_DATA_KEY, JSON.stringify(participant));
}

export function getParticipantToken(): string | null {
  return localStorage.getItem(PARTICIPANT_TOKEN_KEY);
}

export function getParticipant(): Participant | null {
  const raw = localStorage.getItem(PARTICIPANT_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Participant;
  } catch {
    return null;
  }
}

export function clearParticipantSession(): void {
  localStorage.removeItem(PARTICIPANT_TOKEN_KEY);
  localStorage.removeItem(PARTICIPANT_DATA_KEY);
}

export function saveAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
