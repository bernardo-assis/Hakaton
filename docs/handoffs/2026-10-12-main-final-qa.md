# QA final da documentação e das evidências

🔍 **O Sentinela — @qa**. Revisão de 12/10/2026. Referência: `origin/main` no commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`. Documentação editada no workspace `bernardo`, preservando alterações anteriores. Skill QA e AGENTS.md lidos fisicamente antes da revisão; a ferramenta `view_file` não estava disponível e a leitura foi feita por `cat` no ambiente Linux.

## Parecer

A documentação reconcilia o produto atual com endereços, campos, ações, contratos e operação da VPS. **A revisão documental não concede aceite financeiro completo.** O defeito de reassociação de cofre foi reproduzido e permanece identificado como alta prioridade. A implementação não foi alterada nesta tarefa.

Criar agente novo no cofre financiado é uma orientação provisória para demonstração, não uma correção imposta pelo sistema. Não mover agente com histórico, reservas ou pedidos pendentes até resolver a origem financeira imutável e a concorrência.

## Matriz de evidência

| Verificação | Evidência disponível | Interpretação |
|---|---|---|
| Backend main | Coordenador executou 13 suítes / 109 testes e build de produção, com PostgreSQL exclusivo de revisão | Regressões existentes aprovadas; não incluem aceite completo da reassociação |
| Frontend main | Coordenador executou 14 testes, build e lint: zero erros / 11 avisos | Compilação e contratos locais aprovados; bundle 527,66 kB gera aviso |
| Navegador financeiro local | Coordenador executou script de pagamentos com API controlada | Modos, fila, transporte, estado incerto e mobile; nenhum pagamento enviado |
| Manifestos | Coordenador executou três verificações locais | Não certificam manifesto/configuração real da VPS |
| Dependências de produção | Frontend zero / backend três entradas moderadas reportadas pelo coordenador | Não é auditoria do host; não equivale a risco zero |
| Público desktop/mobile | [Relatório e capturas](../review-evidence/2026-10-12/public-browser-report.json) | Landing, Docs e gate anônimo; sem Phantom real ou ações financeiras autenticadas |
| Troca de cofre | [Três reproduções](../review-evidence/2026-10-12/vault-reassignment.repro.test.ts), revisadas por QA | PostgreSQL real / RPC falso; expectativas registram bug atual e devem ser invertidas na correção |
| Documentação | QA leu os guias, contratos, runbook e relatório, comparando trechos relevantes com o snapshot | Revisão estática e verificação de links; não substitui execução do roteiro publicado |

Os testes já executados pelo coordenador não foram repetidos sem necessidade. As três reproduções financeiras são provas diagnósticas: os cenários confirmam migração de gasto histórico, aprovação com outro signer e vínculo desatualizado entre lookup e execução. O terceiro cenário controla a intercalação pela consulta ao repositório; não é um teste de carga ou prova de todos os interleavings possíveis. Não envolveram RPC real.

Para reproduzir, usar somente banco dedicado de revisão e a mesma revisão de código; o arquivo preservado tem imports relativos a `backend/src/__tests__`, onde foi executado. Ele cria fixtures próprias, muda configuração do processo de teste e limpa seu usuário. Não executá-lo contra dados reais nem contra a VPS.

## Correções documentais verificadas

- Os roteiros usam teto de agente 1 SOL / operação 0.5 SOL para os botões fixos de 0.5 e 6 SOL, e 0.01 SOL no formulário para o primeiro envio.
- Phantom autentica; cofre separado paga; chave do agente identifica; destinatário precisa constar na lista exigida.
- Registro, autorização, reserva e liquidação permanecem distintos. Simulação não é gasto do cofre.
- Falha de revalidação em **Approve** mantém o pedido `PENDING` por rollback. Isso difere de nova solicitação persistida como `BLOCKED`.
- Histórico visual omite `error_code`; guias orientam consultar pedido original na API/equipe, sem inventar motivo a partir do estado.
- Índice inclui relatório da revisão e runbook. QA verificou links Markdown locais e `git diff --check` sem erro.
- Readiness deve ser lida no backend: o 200 HTML público de `/readyz` não comprova PostgreSQL disponível.

## O que impede declarar aceite completo

1. Correção e regressões de origem financeira imutável na mudança de cofre, incluindo concorrência e recuperação UNKNOWN.
2. Identificação da release/digest realmente instalada e inspeção autorizada da configuração VPS.
3. Login, recusa, troca de conta e logout com Phantom real no domínio.
4. Pequena transferência Devnet financiada e finalizada, conferindo origem, destino, valor e assinatura.
5. Restore isolado do backup com a mesma chave mestre, seguido de conciliação de operações posteriores ao snapshot.
6. Revisão de acessibilidade e dos ajustes públicos identificados no [relatório principal](../MAIN_VPS_REVIEW_2026-10-12.md).

Esses itens distinguem defeitos reproduzidos de evidências ainda não fornecidas. A revisão não afirma que backup, firewall ou outros controles operacionais estejam ausentes da VPS.

## Revisão adicional do guia único da banca

QA revisou integralmente [JUDGES_GUIDE.md](../JUDGES_GUIDE.md) após sua inclusão. O guia é autossuficiente: explica A (login), B (destinatário) e C (cofre pagador), funding, modo manual, Quick Deploy com edição explícita de limites/lista, três simulações com resultados compatíveis e pagamento manual de 0.01 SOL com prova finalizada C→B.

O cenário usa agente novo, apenas B na whitelist, teto diário de 1 SOL e teto por operação de 0.5 SOL. Uma simulação aprovada consome 0.5; a de 6 ultrapassa o teto por operação; a simulação de 0.5 para A ainda cabe no teto diário e alcança a verificação de destinatário. A orientação de políticas considera limiar humano e piso de saldo para não prometer aprovação com configuração incompatível. Reservas/gasto do executor permanecem distintos do contador UTC simulado.

O guia não exige chave privada, não promete mainnet/multisig/IA externa, explicita custódia do cofre de teste e descreve o defeito financeiro aberto. Resultados esperados e aceite não comprovado na VPS estão claros. Links locais do guia e dos dois índices conferidos, sem ausentes; `git diff --check` aprovado. Não houve repetição das suítes nem ação financeira.
