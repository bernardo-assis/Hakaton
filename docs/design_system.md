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

O Design System está formalizado e pronto para ser aplicado pelo `@dev-front` quando a Fase 2 (execução do Frontend) for iniciada!
