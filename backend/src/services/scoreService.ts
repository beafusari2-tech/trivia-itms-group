const TIME_BONUS_WINDOW_MS = 10_000; // respostas em até 10s podem ganhar bônus
const MAX_BONUS_RATIO = 0.5; // até +50% dos pontos base da pergunta

/**
 * Pontuação = pontos base da dificuldade + bônus de agilidade (linear, até 50%
 * extra para respostas corretas em até 10s; 0% de bônus a partir de 10s).
 * Respostas erradas nunca pontuam.
 */
export function computePoints(basePoints: number, correct: boolean, timeTakenMs: number): number {
  if (!correct) return 0;
  const capped = Math.min(Math.max(timeTakenMs, 0), TIME_BONUS_WINDOW_MS);
  const bonusFactor = (TIME_BONUS_WINDOW_MS - capped) / TIME_BONUS_WINDOW_MS;
  const bonus = Math.round(basePoints * MAX_BONUS_RATIO * bonusFactor);
  return basePoints + bonus;
}

export function resultMessage(percentage: number): string {
  if (percentage >= 90) return "Você é oficialmente um especialista! 🏆";
  if (percentage >= 70) return "Mandou muito bem! 👏";
  if (percentage >= 50) return "Você está no caminho certo! 🚀";
  return "Hora de jogar mais uma rodada! 😎";
}
