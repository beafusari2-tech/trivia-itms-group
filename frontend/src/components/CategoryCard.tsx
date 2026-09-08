import { motion } from "framer-motion";
import { Category } from "../lib/types";

const STYLES: Record<string, { gradient: string; emoji: string }> = {
  catalogacao: { gradient: "from-blue-600 to-cyan-500", emoji: "📚" },
  educacao: { gradient: "from-emerald-500 to-teal-400", emoji: "🎓" },
  ia_plagio: { gradient: "from-fuchsia-600 to-pink-500", emoji: "🤖" },
};

export default function CategoryCard({
  category,
  onSelect,
  loading = false,
  disabled = false,
}: {
  category: Category;
  onSelect: (id: Category["id"]) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const style = STYLES[category.id] || { gradient: "from-accent to-accent-dark", emoji: "🎮" };

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -6, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={() => onSelect(category.id)}
      disabled={disabled}
      className={`group relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${style.gradient} p-6 text-left shadow-xl transition-shadow hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="absolute -right-6 -top-6 text-8xl opacity-20 transition-transform duration-300 group-hover:scale-110">
        {style.emoji}
      </div>
      <div className="text-4xl">{style.emoji}</div>
      <div>
        <h3 className="text-2xl font-extrabold text-white">{category.title}</h3>
        <p className="mt-1 text-sm font-medium text-white/90">{category.tagline}</p>
      </div>
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-black/20 px-4 py-2 text-sm font-bold text-white">
        {loading ? "Preparando..." : "Jogar agora →"}
      </span>
    </motion.button>
  );
}
