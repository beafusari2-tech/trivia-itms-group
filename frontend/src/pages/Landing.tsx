import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import landingCollage from "../assets/landing-collage-original.png";

export default function Landing() {
  const navigate = useNavigate();

  function handleStart() {
    navigate("/cadastro");
  }

  return (
    <Layout>
      <div className="flex w-full flex-1 flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-10">
        <div className="flex flex-col items-center text-center lg:ml-16 lg:w-auto lg:flex-none lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 animate-float-slow text-7xl"
          >
            🧠🎉
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl"
          >
            Bem-vindo(a) à <span className="text-accent">Trivia</span> da ITMS Group
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 max-w-xl text-lg text-ink/70"
          >
            Teste seus conhecimentos e descubra o quanto você sabe sobre tecnologia, educação,
            bibliotecas, catalogação, IA e muito mais!
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleStart}
            className="btn-primary mt-10"
          >
            COMEÇAR A TRIVIA 🚀
          </motion.button>

          <p className="mt-6 text-xs text-ink/50">Leva menos de 3 minutos por categoria</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-sm lg:w-[52%] lg:max-w-none"
        >
          <img src={landingCollage} alt="" aria-hidden="true" className="h-auto w-full" />
        </motion.div>
      </div>
    </Layout>
  );
}
