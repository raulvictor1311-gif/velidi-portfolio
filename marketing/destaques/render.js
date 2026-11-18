/* Gera os destaques do Instagram a partir de src/destaques.html.
 *   node marketing/destaques/render.js        (rode na raiz do repositório; precisa de Playwright e ffmpeg)
 * Saída em marketing/destaques/out/: capas (PNG), stories (PNG) e stories "Carregando…" (MP4 + PNG). */
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(__dirname, "out");
const PORT = 5611;
const URL = (s) => `http://localhost:${PORT}/marketing/destaques/src/destaques.html?s=${s}`;

const STILLS = [
  ["capa-servicos", "01-capa-servicos"], ["capa-projetos", "02-capa-projetos"], ["capa-processo", "03-capa-processo"],
  ["capa-contato", "04-capa-contato"], ["capa-avaliacoes", "05-capa-avaliacoes"],
  ["servicos", "servicos-2-story"], ["projetos", "projetos-2-story"], ["processo", "processo-1-story"], ["contato", "contato-1-story"],
];
const MOTION = [["carregando-servicos", "servicos-1-carregando"], ["carregando-projetos", "projetos-1-carregando"], ["carregando-avaliacoes", "avaliacoes-1-carregando"]];
const LOOP = 4.8, FPS = 30, REPEAT = 2;   // 4,8 s fecha o ciclo do spinner (1,2 s) e da barra (1,6 s)

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const open = async (s) => {
    await page.goto(URL(s), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
  };
  try {
    for (const [s, name] of STILLS) {
      await open(s);
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log("png", name);
    }
    for (const [s, name] of MOTION) {
      await open(s);
      const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "velidi-"));
      const frames = Math.round(LOOP * FPS);
      for (let f = 0; f < frames; f++) {
        const ms = (f / FPS) * 1000;
        await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), ms + 5000);
        await page.screenshot({ path: path.join(tmp, `f${String(f).padStart(4, "0")}.png`) });
      }
      fs.copyFileSync(path.join(tmp, "f0018.png"), path.join(OUT, `${name}.png`));
      execFileSync("ffmpeg", ["-v", "error", "-y", "-stream_loop", String(REPEAT - 1), "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", path.join(OUT, `${name}.mp4`)]);
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log("mp4", name);
    }
  } finally {
    await browser.close();
    server.kill();
  }
})();
