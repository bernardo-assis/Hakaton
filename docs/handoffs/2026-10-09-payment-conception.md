# Passagem de bastão — pagamentos Devnet

Data: 2026-10-09. Agente delegado: payment_plan. Somente concepção; nenhum código ou envio à rede.

Skills reais lidas fisicamente pelo terminal: aas-pm, aas-analyst, aas-ux-expert, aas-architect e aas-sm. Ferramenta view_file indisponível; leitura pelo terminal previamente autorizada pelo usuário.

1. 🎯 @pm — O Estrategista: escopo dos quatro requisitos recebido, SOL/Devnet; não incluir mainnet, USDC, organizações ou mudança visual. Modelo de assinatura/custódia ainda não escolhido. Passa escopo à análise.
2. 📊 @analyst — O Cartógrafo: requisitos separados em prova de propriedade, isolamento, reserva/idempotência, confirmação/contabilidade; sucesso exige testes com duas contas e uma assinatura verificável. PRD conflita com simulador em janela móvel versus dia UTC; decisão registrada no plano, sem assumir aprovada. Passa critérios ao UX.
3. 🎨 @ux-expert — O Artista: manter referência visual existente. Acrescentar somente estado de autenticação, modo SIMULATION versus DEVNET e feedback de assinatura/pendência/resultado, sem redesenho. Passa fluxo ao arquiteto.
4. 🏛️ @architect — O Guardião: revisou rotas, serviços, migrations e documentos. Produziu DEVNET_PAYMENT_PLAN.md com opções de autoridade, migrações propostas e recuperação. Não habilitou serviço legacy. Passa roteiro ao SM.
5. ⚡ @sm — O Comandante: futura execução em banco → backend → frontend → QA, com gates por evidência. Implementação de pagamentos bloqueada até escolha explícita da autoridade; nenhuma story de implementação declarada concluída.

Artefato de revisão: ../architecture/DEVNET_PAYMENT_PLAN.md. Maestro deve validar antes de delegar implementação.

Aprendizado: prova de assinatura de login não delega poder de movimentar fundos; transação deve ter autoridade própria definida. Uma restrição UNIQUE isolada não garante efeito financeiro único sob timeout/reinício.

Proposta de evolução de skill (repetição das revisões de integridade de 08 e 09/10): incorporar em aas-dev-back uma revisão obrigatória de autoridade do signer, reserva compartilhada, persistência pré-broadcast, estados UNKNOWN e conciliação antes de habilitar rotas de pagamento. Não editar skill global fora do workspace; Maestro valida esta proposta e pode incorporar quando autorizado.
