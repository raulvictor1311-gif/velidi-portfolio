# VELIDI.AI — Portfólio

Site estático (HTML + CSS + JS puros). Sem build, sem npm.

## Estrutura

```
index.html              página completa (SEO, Open Graph, JSON-LD)
css/style.css           tokens de cor/tipo, layout e responsivo
js/main.js              animações (GSAP 3.13 + Lenis via CDN) e interações
js/folder-float.js      pastas da seção Serviços: port em JS puro do FolderFloat (React Bits), física com Matter.js
css/folder-float.css    CSS original do FolderFloat + ajustes da marca
js/card-spread.js       leque de celulares da seção Projetos (efeito "Card Spread", implementação própria)
js/tech-text.js         "VELIDI" do topo e do rodapé: port em JS puro do TechText (React Bits), com degradê dourado
css/tech-text.css       CSS original do TechText + encaixe no site
assets/img/             foto do Raul e logo
assets/video/           logo animado (webm + mp4 + poster)
assets/projects/        capas reais dos projetos (prints dos sites no ar)
```

## Rodar localmente

```bash
python3 -m http.server 5590
```

Abra http://localhost:5590

## No ar

- Site: https://velidi-portfolio.vercel.app
- Repositório: https://github.com/raulvictor1311-gif/velidi-portfolio
- A Vercel publica sozinha a cada commit na branch `main` (cerca de 1 minuto).

## Publicar na Vercel (manual, se precisar recriar)

1. Crie uma conta em vercel.com.
2. "Add New → Project" e arraste esta pasta (ou importe de um repositório GitHub).
3. Framework Preset: **Other**. Build command: vazio. Output: `/` (raiz).
4. Deploy. Depois, em Settings → Domains, conecte um domínio quando tiver um.

## Onde editar

- Textos: `index.html` (cada capítulo está comentado: I · HERO, II · SOBRE …).
- Cores: bloco `:root` no topo de `css/style.css`.
- WhatsApp: número `5519984216068` (aparece nos links `wa.me` do HTML e na constante `WA` do `js/main.js`).
- Novo projeto: copie um `<article class="pcard">` dentro de `#projTrack`, salve a capa em `assets/projects/` (1280×800, .webp) e atualize a contagem "09".
