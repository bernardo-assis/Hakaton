# PRD: AgentSafe — Autonomous AI Agent Budget & Security Vault

**Versão:** 1.1 (Revisada & Enriquecida)  
**Data:** 08 de Outubro de 2026  
**Status:** Pronto para Aprovação (Fase 1 - Item 1 Concluído)  
**Hackathon:** Crypto World’s Fair (Colosseum) — Track Solana / Agentic Payments  
**Autor:** @pm (O Estrategista) & @analyst (O Cartógrafo)

---

## 1. Visão Executiva & Contexto

### 1.1 O Problema Real de Mercado
Em 2026, a economia de Agentes de IA Autônomos (AI Agent Economy) é a fronteira mais quente da tecnologia. Agentes pesquisam, codam, compram dados e interagem entre si na web. Para atingir plena autonomia, **agentes precisam de capacidade de pagamento e liquidação financeira**.

Entretanto, as ferramentas financeiras atuais apresentam falhas críticas:
1. **Risco de Liquidez & Drenagem (Prompt Injection / Bugs):** Se um humano compartilhar a chave privada de sua carteira principal com um agente de IA, qualquer falha de raciocínio, alucinação ou ataque adversário (ex: prompt injection forçando o agente a transferir fundos para um terceiro) drenará 100% do saldo do usuário em segundos.
2. **Incompatibilidade do Sistema Bancário Tradicional:** Cartões corporativos tradicionais (Visa/Mastercard) e contas bancárias exigem KYC humano, possuem latência de dias para liquidação internacional e cobram taxas inviáveis para microtransações de centavos entre robôs.

### 1.2 A Solução: *AgentSafe* ("O Brex dos Agentes de IA na Solana")
O **AgentSafe** é um protocolo e dashboard de **Cofres Inteligentes com Políticas de Gastos Programáveis** construído na rede de altíssima velocidade da Solana. 
Ele permite que humanos financiem um cofre mestre e deleguem orçamentos controlados para sub-contas de agentes de IA com **regras invioláveis de segurança**:
* **Teto Diário (Daily Cap):** Limite máximo renovável a cada 24 horas.
* **Teto por Transação (Single Tx Cap):** Limite máximo permitido em uma única compra.
* **Whitelist de Prestadores:** Restrição para transferir fundos apenas para prestadores de serviços pré-autorizados (ex: APIs de dados, oráculos, nós de GPU).
* **Kill Switch Instantâneo (Botão de Pânico):** Congelamento em sub-segundos de um agente ou de todos os robôs da organização com 1 clique.
* **Audit Trail Onchain:** Histórico auditável de aprovações e bloqueios gravados na Solana com confirmação em menos de 1 segundo.

---

## 2. Alinhamento Estratégico com o Crypto World’s Fair (Colosseum)

| Vetor de Avaliação | Como o AgentSafe se posiciona |
| :--- | :--- |
| **Venture Scale ($250k Pre-seed Colosseum)** | Infraestrutura essencial (B2B SaaS + Protocolo) para qualquer empresa ou desenvolvedor que utilize agentes de IA no mundo. |
| **Workshop Oficial da Solana Foundation** | Resposta direta e prática à trilha *"Solana Agentic Payments"* apresentada por Ludo (Solana Foundation). |
| **Vantagens Técnicas da Solana** | Tempo de bloco de ~400ms e taxas de \$0.00025 tornam viáveis microtransações contínuas de \$0.05 a \$5.00 entre agentes. |
| **Pitch & Demo de 3 Minutos** | Visualmente impactante: demonstração de uma IA realizando pagamentos válidos e sendo travada em tempo real ao tentar burlar o limite. |

---

## 3. Personas & Casos de Uso

### Persona 1: Matheus, Engenheiro de IA / Desenvolvedor Autônomo
* **Cenário:** Matheus criou um agente que pesquisa dados de mercado e compra relatórios pagos via API.
* **Dor:** Não quer deixar sua carteira principal conectada ao script da IA, com medo de um loop infinito gastar centenas de dólares.
* **Solução com AgentSafe:** Ele cria o agente no dashboard, define um teto de \$10/dia e máximo de \$2/compra. O script da IA roda tranquilo sem risco de estourar a verba.

### Persona 2: Camila, Head de Produto em uma Startup de IA
* **Cenário:** O time da Camila gerencia uma frota de 15 agentes de IA operando tarefas de atendimento, automação e geração de conteúdo.
* **Dor:** Precisa de governança centralizada, auditoria de gastos por robô e um botão de emergência caso algum agente seja comprometido.
* **Solução com AgentSafe:** Dashboard unificado mostrando consumo em tempo real por robô, logs de segurança e botão de pânico geral para suspender qualquer agente com comportamento anômalo.

---

## 4. Requisitos do MVP

### 4.1 Requisitos Funcionais (RF)

| ID | Nome do Requisito | Descrição Detalhada |
| :--- | :--- | :--- |
| **RF01** | **Gestão de Cofre Mestre** | O usuário conecta sua carteira (Phantom) e visualiza/deposita saldo no cofre principal (ambiente Solana Devnet). |
| **RF02** | **Cadastro & Gestão de Agentes** | Criação de perfis de agentes com nome, propósito, chave pública e parâmetros de segurança: `daily_cap` e `single_tx_cap`. |
| **RF03** | **Políticas de Whitelist** | Configuração opcional de lista de carteiras/contratos permitidos para recebimento de fundos de cada agente. |
| **RF04** | **Motor de Validação de Limites** | Interceptação de cada requisição de pagamento da IA, validando limites de transação, limites diários e status do agente. |
| **RF05** | **Execução Onchain na Solana** | Transações que cumprem os requisitos de segurança são executadas e geram hash público no explorador da Solana. |
| **RF06** | **Bloqueio e Alerta de Segurança** | Tentativas que violam regras são bloqueadas com código de erro explícito e registradas no extrato de auditoria. |
| **RF07** | **Kill Switch (Botão de Pânico)** | Capacidade de congelar (`FROZEN`) um agente individual ou todos os agentes da conta imediatamente. |
| **RF08** | **Extrato de Telemetria Auditável** | Tabela em tempo real com histórico de transações aprovadas e rejeitadas, valores, fornecedores e links onchain. |
| **RF09** | **Simulador Interativo para Pitch** | Painel visual no frontend com gatilhos rápidos para simular na hora: (1) Pagamento Legítimo da IA; (2) Tentativa de Abuso/Excesso. |

### 4.2 Requisitos Não-Funcionais (RNF)

* **RNF01 - Latência de Decisão:** O motor de validação de políticas deve avaliar a requisição em menos de 100ms.
* **RNF02 - Integridade Financeira:** Nenhuma transação pode ser processada se o saldo do cofre for insuficiente ou se o agente estiver congelado.
* **RNF03 - Ambiente de Simulação Sem Custo:** Operação 100% em **Solana Devnet** com airdrop de moedas de teste, garantindo custo zero de desenvolvimento.
* **RNF04 - Separação Estrita de Camadas:** A lógica de negócio e regras de limite residem no backend/dados; o frontend consome via APIs padronizadas.

---

## 5. Regras de Negócio (RN)

```
[RN01] STATUS DO AGENTE
       Se status != 'ACTIVE' (ex: 'FROZEN'), REJEITAR imediatamente com código ERR_AGENT_FROZEN.

[RN02] TETO POR TRANSAÇÃO
       Se valor_solicitado > single_tx_cap, REJEITAR com código ERR_EXCEEDS_SINGLE_TX_LIMIT.

[RN03] TETO DIÁRIO (JANELA DE 24H)
       Se (gastos_ultimas_24h + valor_solicitado) > daily_cap, REJEITAR com código ERR_EXCEEDS_DAILY_BUDGET.

[RN04] POLÍTICA DE WHITELIST
       Se whitelist_ativa == true E destinatario NÃO ESTÁ na lista_permitida, REJEITAR com código ERR_UNAUTHORIZED_RECIPIENT.

[RN05] ATUALIZAÇÃO DO COFRE
       Apenas transações com status APROVADA deduzem saldo do cofre e geram transferência onchain.
```

---

## 6. Fluxos de Usuário & Sistema (Mermaid)

### 6.1 Fluxo de Execução de Pagamento do Agente de IA

```mermaid
flowchart TD
    A[Agente de IA solicita pagamento] --> B{Agente está Ativo?}
    B -- Não (Frozen) --> C[Bloqueio: ERR_AGENT_FROZEN]
    B -- Sim --> D{Destinatário na Whitelist?}
    D -- Não autorizada --> E[Bloqueio: ERR_UNAUTHORIZED_RECIPIENT]
    D -- Sim / Whitelist Off --> F{Valor <= Teto por Transação?}
    F -- Excede --> G[Bloqueio: ERR_EXCEEDS_SINGLE_TX_LIMIT]
    F -- Válido --> H{Gasto 24h + Valor <= Teto Diário?}
    H -- Excede --> I[Bloqueio: ERR_EXCEEDS_DAILY_BUDGET]
    H -- Válido --> J[Executa Transferência na Solana Devnet]
    J --> K[Registra Hash no Log Onchain]
    K --> L[Atualiza Saldo no Dashboard em Tempo Real]
    C --> M[Registra Tentativa Bloqueada no Log de Segurança]
    E --> M
    G --> M
    I --> M
```

### 6.2 Fluxo do Kill Switch (Botão de Pânico)

```mermaid
flowchart LR
    Humano[Usuário / Gestor] -->|Clica no Botão de Pânico| API[Backend AgentSafe]
    API -->|Altera status para FROZEN| DB[(Banco de Dados)]
    API -->|Notifica Sessão Ativa| Event[Evento de Bloqueio Imediato]
    Event -->|Próxima chamada de IA| Reject[Rejeição Instantânea de Qualquer Transação]
```

---

## 7. Critérios de Aceite para Entrega do MVP (Checklist da Banca)

- [x] Documento PRD detalhado e aprovado.
- [ ] Criação de cofre mestre vinculado a endereço de teste.
- [ ] Criação de pelo menos 2 agentes com políticas de teto distintas.
- [ ] Teste de transação legítima aprovada com hash real na Solana Devnet.
- [ ] Teste de transação abusiva rejeitada com alerta visual no dashboard.
- [ ] Botão de Pânico funcional congelando transações em tempo real.
- [ ] Vídeo demonstrativo de 3 minutos validado para a submissão.
