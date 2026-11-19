# Banners de projetos — destaque "Projetos" do Instagram

Um story (1080 × 1920) por projeto, com a **tela real** de cada site capturada no celular.
Mesmo visual do portfólio: preto, dourado e roxo, títulos largos e serifa itálica dourada.

Ordem dos arquivos em `out/` (sugestão de ordem no destaque):

01 La Cruz Estúdio Automotivo · 02 Jesus Lives · 03 Finlux · 04 Maná Café · 05 Minha Rotina · 06 DNA CT ·
07 Lumen Bíblia · 08 W-Race · 09 MotoFlash · 10 Conexão Divina · 11 Glamour Beauty

Sobre as telas (`src/shots/`):
- Capturadas direto dos sites em 19/11/2026, em largura de celular (390 px).
- Minha Rotina e W-Race mostram só a tela de login sem conta; para eles foram usados prints reais do app logado, enviados pelo Raul.
- Foram escondidos apenas os selos de editor ("Edit with Lovable/Base44"), que não fazem parte dos sites.
- Bio Sites não tem banner próprio porque não tem link; o Glamour Beauty é o exemplo real de bio site.

## Como editar
Textos (nome e categoria de cada projeto) ficam no fim de `src/banners.html`. Para atualizar uma tela,
troque o arquivo em `src/shots/`. Depois gere de novo, na raiz do repositório:

```bash
node marketing/projetos/render.js
```
