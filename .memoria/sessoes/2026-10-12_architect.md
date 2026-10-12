# Sessão @architect — revisão main e VPS

- Skills `aas-architect`/`aas-dev-back` e AGENTS lidos fisicamente por cat (view_file ausente neste ambiente Linux).
- Código base `origin/main` 1dd108f5675f982fb5fe70d157f78907ad9f13aa em snapshot /tmp/agentsafe-main-review-20261012; não houve switch, commit, push ou mudança da implementação.
- Regressão importante: main libera mover agente; histórico de pagamentos/cofre é derivado do vínculo mutável. Provas em PostgreSQL dedicado e RPC mock confirmam migração de gasto (A0/B15000), pedido manual aprovado por outro signer e corrida lookupA→moveB→envioA.
- Suíte auxiliar 3/3 reproduções aprovadas, não aceite financeiro. Arquivo temporário reviewVaultReassignment.test.ts; inicialmente tipagem this corrigida no teste, depois execução limpa. Nenhum RPC/pagamento externo.
- Root reportou 13/109 testes originais main e buildprod aprovados.
- Documentos próprios atualizados: docs/architecture/ARCHITECTURE.md, docs/api/REST_API.md, docs/architecture/UI_API_CONTRACT.md, docs/PAYMENT_BACKEND.md, docs/handoffs/2026-10-12-main-architecture-review.md.
- Achados adicionais: error_code omitido do histórico UI e replay bloqueado com status verde; chart mistura simulação e pedidos; marketing predictive/multisig/monitor24h sem suporte funcional; locks origem/destino sem ordem global (risco estático de contenção não reproduzido).
- Lições para AGENTS/skill propostas ao Maestro: cofre de origem imutável por pagamento, considerar efeitos históricos/credenciais ao mover agentes, revalidar vínculo sob lock e testes CONFIRMED/PENDING/UNKNOWN; PASS de suíte de reprodução não equivale a correção/aceite. Maestro consolida AGENTS e atualização de skill recorrente em artefato autorizado do projeto.
