# Contrato atual entre interface e API

Atualizado em 12/10/2026 contra `origin/main` (`1dd108f5675f982fb5fe70d157f78907ad9f13aa`). Contrato detalhado: [REST_API.md](../api/REST_API.md). Este arquivo substitui o contrato do protótipo sem autenticação.

## Sessão e formatos

Todos os endpoints de dados do painel exigem sessão por assinatura de carteira; conexão visual da Phantom não basta. A API fornece desafio, confere assinatura Ed25519/origem/cookie temporário e estabelece cookie HttpOnly. Mutações exigem Origin permitido e `X-AgentSafe-CSRF: 1`. Respostas: `{success:true,data:...}`; erros `{success:false,error:string}`. Valores em lamports são strings; balance desconhecido é `null`, nunca zero inventado. No backend Express interno, `/healthz` e `/readyz` são públicos e têm envelope JSON próprio; `/readyz` verifica PostgreSQL. No domínio publicado revisado, `/healthz` responde texto do Nginx frontend e `/readyz` retorna HTML da SPA com HTTP 200: essas respostas não comprovam que o backend ou banco estão prontos. Ver [DEPLOYMENT.md](../DEPLOYMENT.md) para o contexto do proxy.

## Telas e operações

| Tela/ação | API e resultado |
| --- | --- |
| Login | `/auth/challenge`, `/auth/verify`, `/auth/session`, `/auth/logout` |
| Dashboard | GET `/dashboard`: saldo observado de cofres, tetos, gasto confirmado dos agentes, agentes, histórico e gráfico; RPC indisponível mantém saldo desconhecido |
| Cofre observado | POST `/vaults/local` `{owner_pubkey}`: deve corresponder ao proprietário autenticado; sem signer/custódia da Phantom |
| Cofre de teste | POST `/vaults/devnet` `{daily_cap_lamports?}`: cria endereço separado com signer cifrado, AUTOMATIC e teto padrão de 1 SOL |
| Faucet | POST `/dashboard/deposit` `{amountSol,vault_id?}`: >0 e <=2 SOL, lamports exatos, oficial Devnet; escolher cofre se houver mais de um |
| Cofres | GET `/vaults`; PATCH `/vaults/:id` status; PATCH `/vaults/:id/policies` objeto completo das cinco políticas |
| Recomendação | POST `/vaults/:id/optimize` `{}`: saldo, orçamento restante, recomendação e `transferred:false`; não move dinheiro |
| Agentes | GET/POST `/agents`; PATCH `/agents/:id` nome, papel, limites, status, whitelist e `vault_id`; chave pública obrigatória na criação |
| Lista permitida | PATCH `/agents/:id/whitelist` `{recipients:[{recipient_pubkey,label}]}` substitui lista, até 100 sem duplicatas |
| Histórico do agente | GET `/agents/:id/history` transações e eventos; GET `/agents` inclui `recipients`, gasto real e `simulated_spent_today_lamports` |
| Panic | POST `/agents/panic` `{}` congela agentes apenas do proprietário; não desfaz envio existente |
| Notificações | GET `/notifications` eventos reais, sem contador fictício |
| Simulador | POST `/simulator/evaluate` `{agent_id,amount_lamports,recipient_pubkey,purpose?,request_id}` e GET `/simulator/history` |
| Painel financeiro | GET/PATCH `/vaults/:id/payment-config`; POST/GET `/payments`; GET `/payments/:id`; POST `/payments/:id/approve` ou `/reject` |
| Automação externa | POST `/agent-payments` com Bearer específico; emissão/revogação em `/agents/:id/credentials` |

Mutações/genéricos antigos `POST /transactions`, `POST /vaults`, cadastro `/users` e saques retornam 501. Pagamentos reais de teste usam o executor específico acima, não o signer global legado.

## Estados que a interface precisa explicar

- Simulação retorna `mode:SIMULATION`, `settlement_status:NOT_SUBMITTED`, decisão/reason; grava auditoria e não assina nem transfere. `request_id` repetido reproduz resultado; payload diferente retorna 409.
- Orçamento simulado soma aprovações no dia UTC. Orçamento real soma janela móvel de 24h mais reservas ainda abertas. Não inferir orçamento pela página limitada de histórico.
- Dashboard main agrega pedidos e simulações nas contagens/gráfico. APPROVED não significa pago. As métricas de saldo/gasto real continuam separadas.
- Pedido MANUAL fica `PENDING/NOT_SUBMITTED`, sem reserva até aprovação; AUTOMATIC pode enviar imediatamente. Políticas continuam aplicáveis em ambos.
- 200 pode conter PENDING, UNKNOWN ou replay de BLOCKED. Confirmado exige `settlement_status:CONFIRMED` e consulta finalizada do executor; assinatura/Explorer link sozinho não basta.
- UNKNOWN mantém reserva, é reconciliado sem assinatura substituta, e não deve incentivar repetir com outra chave.
- Painel guarda chave da intenção antes do POST com escopo proprietário/cofre. Ao corrigir regra de pedido bloqueado, replay da mesma intenção permanece bloqueado; só uma nova intenção autorizada pode tentar novamente.

## Mudanças de main que exigem cuidado

`DevnetPayments` oferece copiar endereço, link para faucet oficial, Quick Deploy Test Agent e seleção de agentes de outros cofres. A seleção de outro agente **muda sua associação de cofre por PATCH**, não é uma seleção somente de visualização. Quick Deploy cria identificador público aleatório e agente com limite diário de 5 SOL, individual de 1 SOL e whitelist desligada; não gera IA executando sozinha.

A mudança de cofre está implementada mas apresentou regressões com histórico/fila e concorrência, reproduzidas nesta revisão. Manter agentes com pagamentos no cofre original até corrigir; ver [evidências](../handoffs/2026-10-12-main-architecture-review.md). O histórico financeiro atualmente omite `error_code` na apresentação e pode mostrar apenas “Blocked”; o motivo precisa vir do erro inicial/registro da API. Explicar esse estado no guia e melhorar o feedback no próximo ajuste de UI.

## Limites e atualização

Histórico do painel mostra até 100 pedidos recentes. Fila pendente possui paginação independente por `approval_status=PENDING`, limite até 100 e offset. Simulador/notificações também mostram até 100 eventos, sem alterar agregações completas do orçamento. Pagamentos são atualizados a cada 15 segundos no componente. Leituras/mutações/auth/financeiro têm limiters por IP distintos e cumulativos; detalhes no REST API.

Trocar de carteira/logout deve limpar dados da identidade anterior; componentes usam chaves de sessão distintas. Validar com Phantom real, testes de navegador, desktop/mobile e teclado. Testes com provider injetado não provam a extensão real ou liquidação na VPS.
