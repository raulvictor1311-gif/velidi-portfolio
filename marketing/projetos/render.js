/* Gera os banners de projetos (stories 1080×1920) a partir de src/banners.html.
 *   node marketing/projetos/render.js      (na raiz do repositório; precisa de Playwright)
 * As telas dos sites ficam em src/shots/ (capturas reais em 390 px de largura). Saída em marketing/projetos/out/. */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(__dirname, "out");
const PORT = 5612;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const base = `http://localhost:${PORT}/marketing/projetos/src/banners.html`;
  try {
    await page.goto(base, { waitUntil: "networkidle" });
    const list = await page.evaluate(() => window.PROJECTS.map((p) => p[0]));
    for (const [n, id] of list.entries()) {
      await page.goto(`${base}?p=${id}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      const file = `${String(n + 1).padStart(2, "0")}-${id}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      console.log(file);
    }
  } finally {
    await browser.close();
    server.kill();
  }
})();
