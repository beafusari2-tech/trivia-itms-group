export default function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="glass-card flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-ink">
      <span>⭐</span>
      <span>{score.toLocaleString("pt-BR")} pts</span>
    </div>
  );
}
