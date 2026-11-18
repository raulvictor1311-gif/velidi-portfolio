# Destaques do Instagram — VELIDI.AI

Mesma identidade do portfólio: preto, dourado e roxo, títulos largos e serifa itálica dourada.

## Arquivos (pasta `out/`, gerada pelo `render.js`)

| Destaque | Capa | Stories, nesta ordem |
|---|---|---|
| Serviços | `01-capa-servicos.png` | `servicos-1-carregando.mp4`, `servicos-2-story.png` |
| Projetos | `02-capa-projetos.png` | `projetos-1-carregando.mp4`, `projetos-2-story.png` |
| Processo | `03-capa-processo.png` | `processo-1-story.png` |
| Contato | `04-capa-contato.png` | `contato-1-story.png` |
| Avaliações | `05-capa-avaliacoes.png` | `avaliacoes-1-carregando.mp4` |

Todos têm 1080 × 1920 (formato de story). Os "carregando" também saem em PNG, se preferir imagem parada.

## Como publicar
1. Poste cada story (na ordem da tabela) e salve em um destaque com o nome da coluna da esquerda.
2. Para a capa: no destaque, toque em **Editar destaque → Editar capa**, escolha a imagem da capa
   e centralize o círculo no recorte.

## Como editar
Os textos e o visual ficam em `src/destaques.html`. Depois de mudar, gere de novo na raiz do repositório:

```bash
node marketing/destaques/render.js
```
(Precisa de Node com Playwright e de ffmpeg.)
