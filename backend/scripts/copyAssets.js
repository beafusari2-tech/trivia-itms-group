// Copia arquivos que o tsc nao processa (ex: JSON de perguntas lido via fs)
// de src/ para dist/, para que `node dist/server.js` funcione sem depender
// da pasta src/ em producao.
const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(__dirname, "..", "src", "data"), path.join(__dirname, "..", "dist", "data"));
console.log("[copyAssets] src/data copiado para dist/data");
