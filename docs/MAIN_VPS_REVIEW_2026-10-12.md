# Revisão da main e do site na VPS

Data: 12/10/2026. Site: https://agentsafe.kernellabs.uk/. Código: `origin/main` e `origin/bernardo` no commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`, atualizado por fetch e examinado em snapshot isolado. Documentação preparada no workspace da branch `bernardo`, preservando alterações locais anteriores. Não houve publicação, merge na main ou movimentação de fundos.

## Resultado

O protótipo tem telas, autenticação por carteira, políticas, simulação, cofre separado de teste, execução Devnet, aprovação manual e recuperação implementados. O site público responde e a landing/Docs abrem em desktop e celular. A implementação está além do que os guias antigos descreviam.

**Há uma pendência financeira de alta prioridade na troca de cofre do agente.** A aprovação das suítes existentes não cobre essa regressão. Também faltam evidências de aceite na infraestrutura publicada e ajustes de apresentação. Por isso, “main finalizada” não deve ser usado como declaração de que todo o funcionamento financeiro e operacional foi validado.

O usuário informa que o domínio está em uma VPS. Não foi fornecido acesso SSH nesta revisão. As verificações públicas não certificam o commit instalado, as redes reais, os segredos, a execução de backup nem a liquidação na Solana. Isso representa ausência de evidência nesta auditoria, não prova de ausência desses controles no servidor.

## 1. Verificações realizadas

| Verificação | Resultado | Limite da evidência |
|---|---|---|
| Referências remotas | main e bernardo no mesmo `1dd108f` | Não identifica a imagem da VPS |
| Migrações PostgreSQL | 0001 a 0004 aplicadas no banco exclusivo de revisão | Não alterou o banco local do usuário nem a VPS |
| Backend da main | 109 testes, 13 suítes, aprovados | Casos usam fixtures e RPC controlado; não provam liquidação externa |
| Build de produção backend | Aprovado | Compilação TypeScript |
| Frontend da main | 14 testes aprovados | Contratos, estados e transporte local |
| Build frontend | Aprovado; bundle principal 527,66 kB minificado | Aviso de tamanho; não falha de build |
| Lint frontend | 0 erros e 11 avisos | Avisos de efeitos/dependências e pureza; avaliar pontualmente |
| Regressão de pagamentos no navegador | Aprovada: modos, fila, CSRF, estado incerto e mobile sem erro de runtime | API de pagamento inteiramente controlada; nenhum envio |
| Manifestos locais | 3 verificações aprovadas | Os manifestos não descrevem a instalação Swarm real |
| Audit de dependências de produção | Frontend: 0; backend: 3 entradas moderadas na cadeia stream-json/jayson/web3.js; nenhuma alta/crítica reportada | Resultado de pacote nesta data; não inclui scan do sistema/container nem prova exploração |
| HTTP público | HTTP redireciona 301 para HTTPS; raiz e sessão anônima retornam 200 | Não exercita login ou pagamento autenticado |
| Navegador público | Landing, Docs e bloqueio de acesso anônimo em 1440×900 e 390×844; sem exceções JavaScript capturadas | Sem Phantom real ou dados privados |
| Nova reprodução financeira | 3 cenários demonstram comportamento incorreto da troca de cofre | Testes de reprodução aprovados significam bug reproduzido, não funcionalidade aceita |

Os testes foram executados com o snapshot da main e dependências já instaladas, usando PostgreSQL descartável separado. Nenhum worker financeiro real foi iniciado contra dados de usuário.

## 2. Pendência alta: cofre histórico e signer após mover agente

A main permite alterar `agents.vault_id` e a interface oferece reassociação ao selecionar agentes de outro cofre. A propriedade do destino é validada, mas o pagamento não guarda sua própria origem financeira imutável. As consultas de gastos, reservas, listas e aprovação derivam o cofre atual do agente.

Três reproduções com PostgreSQL real e RPC inteiramente falso confirmaram:

1. Um pedido liquidado pelo signer A, com principal de 10.000 e taxa de 5.000 lamports, contabiliza 15.000 no cofre A. Após mover o agente para B, A mostra 0 e B mostra 15.000; o detalhe do pagamento passa a apresentar B.
2. Um pedido manual criado para B sai da fila B e aparece na fila A depois da movimentação. Sua aprovação passa a usar o signer A.
3. Entre a consulta inicial do cofre e a aquisição/revalidação do pagamento, uma movimentação interveniente pode deixar o envio usando A enquanto agente e histórico apresentam B.

Evidências no código revisado: `backend/src/repositories/UiRepository.ts` (mutação/locks do agente), `PaymentRepository.ts` (cofre derivado do agente e agregações) e `backend/src/services/paymentService.ts` (lookup, lock e ciclo financeiro). A revisão de arquitetura traz as linhas e os cenários completos em [sua passagem de bastão](handoffs/2026-10-12-main-architecture-review.md).

O [teste de reprodução preservado](review-evidence/2026-10-12/vault-reassignment.repro.test.ts) foi executado no diretório `backend/src/__tests__` do snapshot; seus imports são relativos a esse contexto. Ele registra o comportamento incorreto atual e não deve virar teste de aceite positivo desse comportamento. Uma correção deve inverter essas expectativas.

**Ação de curto prazo para demonstração:** criar um agente novo no cofre correto e evitar mover agentes com histórico, reservas ou pedidos pendentes. Isso é orientação operacional; o código ainda não impõe a restrição.

**Critério de conclusão:** impedir reassociação quando houver operações financeiras, ou persistir e usar cofre/signer de origem imutáveis em pedido, agregação, aprovação e recuperação. Revalidar a associação sob o lock e provar concorrência entre mudança de cofre e pagamento. UNKNOWN deve continuar conciliado na origem sem perder reserva. Não basta checar que o cofre de destino pertence ao mesmo usuário.

## 3. Pendências de experiência e apresentação

| Prioridade | Observação confirmada | Próxima ação e aceite |
|---|---|---|
| Média | Erros de faucet não reconhecidos viram `Internal Server Error`; sem log remoto não se distingue quota, timeout ou confirmação | Classificar falhas externas com mensagens úteis e logs seguros; manter proteção de detalhes internos; conferir saldo/assinatura antes de repetir |
| Média | Histórico de pagamento não exibe `error_code`; solicitação bloqueada pode aparecer em mensagem verde de registro | Mostrar motivo e estado de bloqueio, sem sugerir sucesso financeiro; registrar ID/resultado para investigar |
| Média | Intenção bloqueada conserva identidade até resposta terminal; corrigir limite não altera o pedido original | Tornar explícita a diferença entre repetir intenção e criar novo pedido; preservar retry quando resultado for incerto |
| Média | Landing anuncia forecasting, predictive analytics, multisig e neutralização contínua de ameaças; implementação revisada é política determinística com signer separado | Ajustar afirmações à entrega ou identificar roadmap; não apresentar simulação como pagamento finalizado |
| Média | Depoimentos de instituições/pessoas aparecem sem comprovação no repositório | Comprovar autorização/evidência ou identificá-los como exemplos/removê-los |
| Baixa | GitHub/X/Discord apontam para portais genéricos; Privacy/Terms/Security Disclosures usam `#`; preços levam ao app sem checkout demonstrado | Direcionar a recursos reais e explicar alcance dos planos; validar destino de cada CTA |
| Baixa | Título da aba é `frontend`; rótulo do botão Phantom quebra para fora da altura no celular | Nome/descrição próprios e cabeçalho legível em 390 px e zoom; navegação usa scroll interno, sem overflow global observado |
| Baixa | Bundle >500 kB e 11 avisos lint | Medir carregamento e revisar os avisos; separar telas se a medição justificar |
| Baixa | Metadado de pacote declara MIT, mas falta arquivo LICENSE | Definir licença da entrega e adicionar o texto correspondente se escolhido pelo responsável |

O painel Overview agora agrega aprovações/bloqueios e gráfico de simulação junto aos contadores do executor. Saldo e histórico de pagamento não devem ser interpretados a partir dessas aprovações agregadas. A documentação atual explica a separação; o texto público dentro do aplicativo também deve ser sincronizado quando uma nova versão for publicada.

## 4. Pendências de operação e aceite publicado

- **Identificação da release:** registrar commit e digest das imagens reais. Nome de asset e horário de modificação não certificam versão.
- **Manifesto real da VPS:** a memória relata Swarm/Traefik, mas não há manifesto versionado; inventariar stack, redes, serviços, volumes, réplicas e recursos sem segredos.
- **Saúde:** `/healthz` público verifica Nginx; `/readyz` público devolve HTML de fallback com 200. Readiness do backend/PostgreSQL deve ser conferida na rede interna ou em rota explicitamente configurada.
- **Backup e recuperação:** comprovar dump restaurado em ambiente isolado, preservação da mesma chave mestre, armazenamento externo e conciliação de pedidos que possam ter sido transmitidos após o snapshot.
- **Proxy/cookies/limites:** conferir produção Secure, origem, cadeia de proxy/IP e orçamento de polling no ambiente real.
- **Aceite Phantom e pagamento:** registrar login/recusa/troca de conta/logout com extensão real e pequena transferência Devnet com origem, destinatário, valor, assinatura e finalização no Explorer. As capturas de simulação fornecidas pelo usuário comprovam avaliações de regras, não essa liquidação.
- **Manutenção de dependências:** tratar as entradas moderadas de produção com avaliação de compatibilidade e regressão; não executar atualização automática de dependências na VPS nesta auditoria.

Detalhes e comandos de inspeção, backup e restauração estão em [DEPLOYMENT.md](DEPLOYMENT.md) e [VPS_RUNBOOK.md](VPS_RUNBOOK.md). Os nomes desconhecidos são placeholders, não nomes supostamente existentes na VPS.

## 5. Documentação entregue

O [índice](README.md) reúne guia completo de usuário, teste público, testes de telas/login/pagamento, API e arquitetura atual e operação da VPS. Os guias antigos foram reconciliados com os contratos: assinatura de login, sessões e CSRF, cofre separado, SOL Devnet, allowlist, limites, reservas, estados de liquidação e desativação do caminho legado `/api/transactions`.

Documentos de QA e concepção anteriores continuam sendo evidência histórica. Eles não foram reinterpretados como teste desta instalação nem como comprovação de cada requisito novo. Esta revisão altera documentação; as pendências de código, instalação e publicação continuam identificadas acima.

## 6. Capturas da inspeção pública

- [Landing desktop](review-evidence/2026-10-12/landing-desktop.png)
- [Landing mobile](review-evidence/2026-10-12/landing-mobile.png)
- [Docs mobile](review-evidence/2026-10-12/docs-mobile.png)
- [Relatório de navegador público](review-evidence/2026-10-12/public-browser-report.json)

O relatório registra DOM público e exceções capturadas. Cancelamentos de mídia associados à navegação foram observados; não são, por si só, falhas de carregamento ou pagamento. Não contém sessão autenticada, segredos ou dados privados.
