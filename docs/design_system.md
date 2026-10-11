# Design System: AgentSafe

**Versão:** 1.0  
**Data:** 08 de Outubro de 2026  
**Status:** Aprovado & Documentado  
**Fonte de Inspiração:** Dashboard Finexy extraído do Figma (`7Q8R7wlsN53dzXnsKQSS8f`)  
**Autor:** @ux-expert (O Artista)

---

## 1. Visão Geral do Design & Identidade Visual

O **AgentSafe** adota uma estética **Fintech Neo-Bank de Alto Padrão** (estilo Brex / Mercury / Linear), combinando a leveza de um fundo claro e limpo com acentos em verde-lima vibrante, cartões escuros sofisticados e cantos arredondados generosos.

* **Tom:** Profissional, institucional, de alta confiança financeira e com apelo moderno para fundadores de IA e investidores Web3.
* **Aspecto Geral:** Cards brancos flutuantes sobre canvas cinza-suave, tipografia geométrica precisa e micro-interações elegantes.

---

## 2. Paleta de Cores Oficial

### 2.1 Cores Primárias & Canvas

| Papel | Nome | Hexadecimal | Uso no Tailwind |
| :--- | :--- | :---: | :--- |
| **Canvas de Fundo** | Gray Canvas | `#F4F5F6` | `bg-[#F4F5F6]` |
| **Superfície de Cards** | Pure White | `#FFFFFF` | `bg-white` |
| **Acento Primário (CTA)** | Neon Lime | `#B6F03F` | `bg-[#B6F03F]` / `text-[#111827]` |
| **Verde Floresta (Gradiente)** | Forest Emerald | `#15803D` → `#052E16` | `bg-gradient-to-br from-emerald-600 to-emerald-950` |
| **Texto Principal** | Slate Deep Black | `#111827` | `text-gray-900` |
| **Texto Secundário / Labels** | Muted Slate | `#6B7280` | `text-gray-500` |
| **Bordas Suaves & Divisores** | Subtle Border | `#F3F4F6` | `border-gray-100` |

### 2.2 Cores de Status & Telemetria

| Status | Cor | Hexadecimal | Uso |
| :--- | :--- | :---: | :--- |
| **Aprovada / Ativo** | Emerald Green | `#10B981` | Badge verde com dot pulsante |
| **Bloqueada / Alerta** | Crimson Red | `#EF4444` | Alertas de limite estourado / Kill switch |
| **Pendente / Em Processamento** | Warm Amber | `#F59E0B` | Transação em confirmação no bloco Solana |
| **Congelado (Frozen)** | Slate Muted | `#64748B` | Agente pausado pelo botão de pânico |

---

## 3. Tipografia

* **Família Principal:** `Inter`, `Plus Jakarta Sans` ou `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.
* **Escala Tipográfica:**
  * **Display / Saldo Principal:** `text-4xl` a `text-5xl` (36px - 48px), `font-bold`, `tracking-tight`.
  * **Títulos de Seção:** `text-lg` a `text-xl` (18px - 20px), `font-semibold`, `text-gray-900`.
  * **Subtítulos & Metadados:** `text-sm` (14px), `font-medium`, `text-gray-500`.
  * **Tabelas & Logs:** `text-xs` a `text-sm` (12px - 14px), `font-normal`, `font-mono` para endereços de carteira Solana.

---

## 4. Forma, Espaçamento e Elevação

* **Border Radius:**
  * **Outer App Container:** `rounded-3xl` (24px a 32px)
  * **Cards Principais:** `rounded-2xl` (20px)
  * **Botões & Mini-Cards:** `rounded-xl` (12px a 14px)
  * **Pills & Badges:** `rounded-full` (9999px)
* **Sombras (Box-Shadow):**
  * Cards flutuantes: `shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]`
  * Destaques: `shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]`

---

## 5. Mapeamento de Componentes (Dashboard AgentSafe)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🟢 AgentSafe     [ (Overview) (Agentes) (Políticas) (Transações) (Simulador) ]     🔍  🔔  [ Conectar Phantom ]     │
├────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ ☀️ ]  │  Good morning, [Founder] — Fleet Security & Agent Budget Control                                           │
│ [ 🌙 ]  ├────────────────────────────────────┬─────────────────────────────┬────────────────────────────────────────┤
│        │ 💳 SALDO TOTAL DO COFRE            │ 📊 MÉTRICAS RÁPIDAS         │ 📈 VOLUME DIÁRIO DE TRANSAÇÕES         │
│ [ 🎛️ ] │    $50,000.00 SOL/USDC             │ ┌──────────────┬──────────┐ │ Gráfico de barras verticais            │
│ [ 👥 ] │    ↑ 100% Protegido                │ │ Agentes: 6   │ Hoje: $42│ │ (Aprovadas em Verde vs.                │
│ [ 📑 ] │    [ + Depositar SOL ] [ Retirar ] │ ├──────────────┼──────────┤ │  Bloqueadas em Preto/Vermelho)         │
│ [ 🛡️ ] │                                    │ │ Aprovadas:148│ Bloq.: 14│ │                                        │
│ [ ⚙️ ] │ 🤖 AGENTES ATIVOS (Mini-Cards)     │ └──────────────┴──────────┘ │                                        │
│        │  • Pesquisa: $22/50 SOL [Ativo]    │                             │                                        │
│        │  • DevOps:   $18/30 SOL [Ativo]    │                             │                                        │
│        │  • Trader:   $0/10  SOL [Frozen]   │                             │                                        │
│        ├────────────────────────────────────┴─────────────────────────────┴────────────────────────────────────────┤
│        │ 🛑 LIMITE DA FROTA: $1,400 / $5,500 Gastos hoje ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│        ├────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│        │ 💳 CARTÕES VIRTUAIS DOS AGENTES    │ 📋 ATIVIDADES RECENTES (Extrato Auditável)                            │
│        │ [ Cartão Metálico Dark da IA ]     │ [ Buscar... ]                                   [ Filtro: Todos ]     │
│        │    Research Agent • Active         │  ID        Agente        Serviço      Valor     Status     Horário    │
│        │    Key: 4356 • Cap: $50/dia        │  tx_104    Pesquisa      OpenAI API   $2.50     ● Aprovado 14:20      │
│        │    [ Botão de Pânico Individual ]  │  tx_105    Automação     GPU Node     $55.00    ● BLOQUEADO 14:18     │
│        │                                    │  tx_106    DevOps        GitHub API   $0.80     ● Aprovado 14:15      │
└────────┴────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 6. Inspiração Visual Arquivada

A imagem original de referência foi baixada e arquivada localmente em:
* [`docs/inspiration_dashboard.png`](file:///c:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/docs/inspiration_dashboard.png)

---

## 7. Landing Page — Seção 3: Features Grid (Extração Visual)

**Referência:** Tela "AI Finance / Features" enviada pelo usuário (3 esferas 3D holográficas, tema escuro).

### 7.1 Paleta da Seção
* **Background Seção:** `#070A08` / `#0C1411` (Deep Obsidian / Forest Dark)
* **Card Surface:** `#0D1311`/80 com backdrop-blur-xl e borda suave `1px solid rgba(255, 255, 255, 0.08)`
* **Acento Primário:** `#B6F03F` (Neon Lime) para tags, micro-dots e glow no hover
* **Acento Secundário:** `#38BDF8` / `#00D2FF` (Cyan Glow) em harmonia com os nós de dados
* **Texto Primário:** `#FAFCFA` / `#FFFFFF` (Heading 1 & Card Titles)
* **Texto Secundário:** `#94A3B8` (Subtítulo e descrições)

### 7.2 Tipografia & Hierarquia
* **Eyebrow Tag:** `text-[12px] md:text-[14px]`, `tracking-[0.25em]`, `uppercase`, `text-[#B6F03F]`
* **Headline:** `text-[36px] md:text-[48px] lg:text-[52px]`, `font-medium`, `tracking-tight`, `leading-[1.15]`
* **Subtitle:** `text-[16px] md:text-[18px]`, `text-[#94A3B8]`, `max-w-2xl`
* **Card Titles:** `text-[20px] md:text-[22px]`, `font-semibold`, `text-white`
* **Card Description:** `text-[14px] md:text-[15px]`, `text-[#94A3B8]`, `leading-relaxed`

### 7.3 Grid & Composição
* Grid horizontal com 3 colunas simétricas (`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8`).
* Cards com cantos generosos (`rounded-[24px]`), padding interno e proporção vertical elegante.
* Topo do Card: Arte 3D holográfica 1:1 com bordas arredondadas internas (`rounded-[18px]`), sobreposição de gradiente de sombra suave.
* Rodapé do Card: Título + Descrição concisa com alinhamento à esquerda.

### 7.4 Motion Design
* Hover sutil com elevação `translate-y-[-4px]` e aumento do brilho da borda (`border-[#B6F03F]/30`).
* Brilho de fundo radial suave (`radial-gradient`) que acompanha o card no hover.

---

## 8. Landing Page — Seção 4: Testimonials (Extração Visual)

**Referência:** Tela "What our clients say." (fundo sólido, 3 colunas limpas sem container).

### 8.1 Regras de Design
* **Fundo Sólido Matte (`#070814`):** Rompe temporariamente a transparência/vidro para dar descanso visual e foco na leitura humana, enquanto o vídeo de fundo permanece rodando globalmente por trás da camada.
* **Layout:** 3 colunas horizontais limpas e simétricas, sem bordas nem caixas rígidas.
* **Componentes por Coluna:**
  * Avatar circular (`w-12 h-12 rounded-full border border-white/10`)
  * Nome do cliente (16px, font-semibold, branco `#FFFFFF`)
  * Cargo e Empresa (12px, font-medium, uppercase, `#94A3B8`, tracking largo)
  * Depoimento (15px-16px, leading-[1.65], `#CBD5E1`)

---

## 9. Landing Page — Seção 5: Pricing (Extração Visual)

**Referência:** Tela "Plans for every scale." (fundo sólido, destaque do plano Professional).

### 9.1 Regras de Design
* **Fundo Sólido Matte (`#070814`):** Mantém a consistência com a seção de depoimentos e contraste elevado.
* **Grid de 3 Planos:** Starter ($199/mo), Professional ($499/mo), Enterprise ($899/mo).
* **Tratamento Diferenciado por Nível:**
  * **Planos Laterais (Starter & Enterprise):** Flat contra o fundo escuro, texto limpo, botão pill dark com borda sutil.
  * **Plano Central (Professional - Featured):** Container em caixa preta elevada (`bg-[#030408] border border-white/15 rounded-[26px]`), linha divisória fina abaixo do subtítulo, sombra profunda e botão de ação branco sólido (`bg-white text-black font-semibold`).
* **Marcadores:** Losangos técnicos em ciano/azul (`◆`) com espaçamento confortável.

---

## 10. Landing Page — Seção 6: Footer & Pre-CTA (Extração Visual)

### 10.1 Regras de Design
* **Fundo:** `#060D0C` com linha divisória superior sutil `border-t border-white/10`.
* **Pre-Footer CTA Banner:** Card escuro elevado (`bg-[#0C1411] border border-white/10 rounded-[24px]`) com chamada para ação ("Ready to safeguard your AI agent fleet?"), botão principal em Verde Neon (`#B6F03F`) e botão secundário dark com borda sutil.
* **Colunas de Navegação:** Grid responsivo (Branding + Status Pill operacional, Protocolo, Recursos e Comunidade).
* **Rodapé Inferior:** Copyright, status da Solana Devnet e links legais discretos em `#FAFCFA]/50`.



