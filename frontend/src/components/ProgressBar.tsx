export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs font-semibold text-ink/60">
        <span>
          Pergunta {Math.min(current + 1, total)} de {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
