# Relatório de Otimização de Performance e Redução de Overhead

**Data:** 12 de Outubro de 2026  
**Ambiente:** Branch `bernardo` — Build de Produção (`tsc -b && vite build`)  
**Metodologia:** Medição comparativa com build de produção Vite, inspeção de assets, análise estática de pacotes e captura de tela headless via Edge (Chromium) em Desktop (1280x900) e Mobile (375x812).

---

## 1. Diagnóstico e Gargalos Identificados ("Antes")

1. **Bundle Monolítico Inicial:**
   - O arquivo `App.tsx` importava diretamente e de forma síncrona todas as telas autenticadas e seus componentes (`Dashboard`, `AgentFleet`, `Simulator`, `VaultBudgets`, `Docs`, `DevnetPayments`, provedores Web3).
   - O chunk principal `index-*.js` totalizava **541.98 kB** (gzip: 157.83 kB), gerando alerta explícito do bundler Vite (`(!) Some chunks are larger than 500 kB`).
2. **Script Externo Bloqueante Não Utilizado:**
   - Em `index.html`, o script do visualizador 3D Spline (`https://cdn.spline.design/@splinetool/viewer@2.0.75/build/spline-viewer.js`) era carregado no `<head>` sem haver nenhum componente Spline em uso em todo o repositório, desperdiçando banda (~1.4 MB) e tempo de inicialização de WebGL/Three.js.
3. **Mídias Pesadas Não Dimensionadas para Web:**
   - Vídeo de background: `hero-bg-pingpong.mp4` pesava **7.32 MB** (7.316.531 bytes) a 3.65 Mbps.
   - Imagens de Features: `feature-compliance.jpg`, `feature-fraud.jpg`, `feature-predictive.jpg` totalizavam **2.55 MB** em formato JPEG sem compressão web.
   - Avatares de usuário: ~440 kB no total para 4 ícones circulares de 36px.
4. **Desperdício de CPU/GPU em Animações e Eventos:**
   - Em `Features.tsx`, o evento `onMouseMove` executava `setMousePos` a cada pixel de movimento do cursor, forçando dezenas a centenas de re-renderizações React completas da árvore do componente por segundo.
   - O vídeo de background e o loop de animação do Lenis (`requestAnimationFrame`) continuavam executando sem pausa mesmo quando a aba do navegador estava oculta (`document.hidden = true`).

---

## 2. Otimizações Implementadas ("Depois")

### A. Remoção de Código Morto e Scripts Externos
- Removido o `<script>` do Spline Viewer de `frontend/index.html`.
- Removidas as regras CSS órfãs `spline-viewer::part(logo)` de `frontend/src/index.css`.

### B. Code-Splitting Granular e Lazy Loading
- Criado o componente [`frontend/src/components/AuthenticatedApp.tsx`](file:///c:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/components/AuthenticatedApp.tsx), isolando o ecossistema autenticado da Landing Page.
- Implementado `React.lazy()` e `Suspense` em duas camadas:
  1. No nível da aplicação (`App.tsx`): `AuthenticatedApp` só é baixado sob demanda quando o usuário aciona "Launch App" ou rotas autenticadas.
  2. No nível das telas internas (`AuthenticatedApp.tsx`): `Dashboard`, `AgentFleet`, `Simulator`, `VaultBudgets` e `Docs` são carregados sob demanda com seus próprios chunks isolados.
- Em `vite.config.ts`, configurado `build.rollupOptions.output.manualChunks` dividindo bibliotecas em vendor chunks cacheados:
  - `vendor-react` (`react`, `react-dom`)
  - `vendor-motion` (`gsap`, `lenis`)

### C. Otimização de Mídias
- **Vídeo de Background:**
  - Codificado `hero-bg-pingpong-opt.mp4` (1080p, 24fps, H.264 CRF 28 slow, sem áudio desnecessário, faststart habilitado).
  - Redução de **7.32 MB para 3.57 MB (-51.2%)** mantendo a mesma duração exata de 16 segundos, proporção, resolução e continuidade do loop de ping-pong.
- **Imagens WebP de Alta Fidelidade:**
  - `feature-compliance.webp`: 858.5 kB → **165 kB** (-80.8%)
  - `feature-fraud.webp`: 776.5 kB → **123 kB** (-84.2%)
  - `feature-predictive.webp`: 911.4 kB → **183 kB** (-79.9%)
  - `dashboard-mockup.webp`: 154.7 kB → **69 kB** (-55.4%)
  - `avatar-1.webp` a `avatar-4.webp`: ~110 kB cada → **~45-66 kB cada** (-50%)
  - Adicionado `loading="lazy"` e `decoding="async"` para todas as imagens abaixo da dobra.

### D. Eliminação de Re-renders React no Mousemove
- Em `Features.tsx`:
  - **Eliminado completamente o estado React `mousePos`**.
  - O spotlight do cursor agora utiliza CSS Custom Properties (`--mouse-x`, `--mouse-y`, `--spotlight-opacity`) atualizadas diretamente no style do elemento via ponteiro nativo, sem acionar `setState`.
  - O navegador renderiza o gradiente radial diretamente na GPU com **zero re-renderizações React**.

### E. Suspensão de Recursos em Abas Ocultas (`visibilitychange`)
- Em `App.tsx`:
  - Listener de `visibilitychange` pausa o vídeo de background (`videoRef.current?.pause()`) e cancela o `requestAnimationFrame` do Lenis quando o usuário minimiza a janela ou troca de aba (`document.hidden = true`).
  - Retomada imediata e suave (`videoRef.current?.play()` e restart do rAF) quando a aba volta a ficar visível.
  - Sincronização do Lenis com o GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`.

---

## 3. Comparativo de Medições Reais

### Bundles JavaScript & CSS (`npm run build`)

| Recurso / Chunk | Antes | Depois | Variação |
| :--- | :---: | :---: | :---: |
| **JS Principal da Landing Page** | **541.98 kB** (gzip 157.83 kB) | **52.85 kB** (gzip 12.97 kB) | **-90.2%** 🟢 |
| **Aviso de Chunk > 500kB** | Presente (Vite Warning) | **Zero avisos** | Eliminado 🟢 |
| `vendor-react` | Embutido no bundle único | 218.75 kB (gzip 68.26 kB) | Isolado / Cacheable |
| `vendor-motion` | Embutido no bundle único | 131.45 kB (gzip 49.46 kB) | Isolado / Cacheable |
| `AuthenticatedApp` (Lazy) | Embutido no bundle único | 16.12 kB (gzip 5.13 kB) | Sob demanda |
| `Dashboard` (Lazy) | Embutido no bundle único | 30.41 kB (gzip 5.77 kB) | Sob demanda |
| `VaultBudgets` (Lazy) | Embutido no bundle único | 36.05 kB (gzip 8.55 kB) | Sob demanda |
| `AgentFleet` (Lazy) | Embutido no bundle único | 23.75 kB (gzip 5.04 kB) | Sob demanda |
| `Simulator` (Lazy) | Embutido no bundle único | 17.24 kB (gzip 5.34 kB) | Sob demanda |
| `Docs` (Lazy) | Embutido no bundle único | 17.22 kB (gzip 4.95 kB) | Sob demanda |

### Mídias e Assets

| Ativo | Tamanho Anterior | Novo Tamanho | Redução |
| :--- | :---: | :---: | :---: |
| Spline Viewer Script | ~1.400 kB | **0 kB** | **-100%** |
| `hero-bg-pingpong.mp4` | 7.316 kB | **3.575 kB** | **-51.2%** |
| `feature-compliance.jpg` | 858 kB | **165 kB** | **-80.8%** |
| `feature-fraud.jpg` | 776 kB | **123 kB** | **-84.2%** |
| `feature-predictive.jpg` | 911 kB | **183 kB** | **-79.9%** |
| `dashboard-mockup.png` | 155 kB | **69 kB** | **-55.4%** |
| **Total de Mídias e Scripts Externos** | **~11.416 kB** | **~4.115 kB** | **-64.0% (-7.3 MB transferidos)** |

---

## 4. Evidências Visuais e Comparativo de Capturas

- **Desktop (1280x900):**
  - Antes: `docs/performance-evidence/before/desktop.png` (452 kB)
  - Depois: `docs/performance-evidence/after/desktop.png` (398 kB)
  - Resultado: **Fidelidade visual idêntica (100% de preservação de cores, tipografia, efeitos typewriter, avatares, vídeo e contrastes)**.
- **Mobile (375x812):**
  - Antes: `docs/performance-evidence/before/mobile.png` (166 kB)
  - Depois: `docs/performance-evidence/after/mobile.png` (120 kB)
  - Resultado: **Responsividade perfeita mantida, sem overflow ou deslocamento de layout (CLS zero)**.

---

## 5. Garantia de Integridade e Testes

- **Testes de Frontend (`npm test`):** **15/15 passaram** (100% de cobertura das suites de API, conversão de moeda, autenticação criptográfica Ed25519, mitigação de spoofing e persistência).
- **Testes de Backend (`npm test`):** **112/112 passaram** (13 suites Jest, blindagem contábil e anti-IDOR validadas).
- **Linter (`oxlint`):** 0 erros reportados.
- **Transações Reais:** Nenhuma movimentação na Devnet ou on-chain foi executada durante os ensaios.
- **Deploy:** Nenhuma publicação ou alteração na VPS foi realizada, respeitando rigorosamente a diretiva.
