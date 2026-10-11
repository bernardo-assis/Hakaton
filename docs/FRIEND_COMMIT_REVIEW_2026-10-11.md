# Comparação com o trabalho da dev-jotaf — 2026-10-11

Revisão somente de leitura do código/histórico remoto após fetch. HEAD analisado: `77057a10404a911df0112a47e2185999cb4ec619` (jota-labs, 19:10:55 -03:00). Nenhum merge, checkout, commit, push ou pagamento executado. Alterações locais preservadas. Testes da nova branch não executados; evidências da implementação local constam nos guias QA existentes.

## Histórico e entregas

`origin/bernardo` (`f5f192b`) é ancestral de `origin/dev-jotaf`. O amigo já incorporou integração de telas e autenticação/isolamento por carteira. Há 23 commits posteriores ao HEAD remoto bernardo; portanto a revisão inclui a sequência, não apenas o último commit.

- Landing page com Hero, Solutions, Features, Services, Testimonials, Pricing e Footer, imagens/vídeos, GSAP e Lenis.
- Navegação landing → aplicativo/documentação e retorno à landing; página Docs pública.
- Traduções para inglês, correções de encoding, botões cancelar/fechar em modais.
- Headers HTTP de segurança, HSTS em produção e rate limit específico de transações.
- Executor antigo ampliado com whitelist, congelamento do cofre e políticas; registro de motivo de bloqueio e botão de pagamento real no simulador.

## O que nossa implementação acrescenta

| Tema | dev-jotaf | Trabalho local |
|---|---|---|
| Origem dos fundos | Treasury global configurada; consulta saldo do vault | Signer cifrado exclusivo por cofre separado Devnet |
| Aprovação | Política recusa com APPROVAL_REQUIRED | Automático/manual selecionável, fila versionada aprovar/recusar |
| Concorrência | Consulta consumo e insere sem reserva serializada | Lock compartilhado por cofre e reserva de saldo/orçamento/taxas |
| Janela | CURRENT_DATE e created_at | 24h móvel; pendências antigas continuam reservadas |
| Idempotência | UNIQUE e hash recebido do cliente | Payload normalizado/hash servidor, replay recupera registro, conflito409 |
| Envio incerto | Exceção vira FAILED | Bytes/assinatura duráveis, UNKNOWN, recuperação sem reassinar |
| Confirmação | sendAndConfirmTransaction legado | Finalização e mensagem esperada verificadas, contabilidade de taxas |
| Agente autônomo | Login owner para rota financeira | Credenciais hash com expiração/revogação e API Bearer escopada |
| Painel | Botão real no simulador | Painel Devnet separado, modo, fila paginada, gastos/reservas e histórico |

## Achados que precisam de ajuste na integração

1. **Signer global sem vínculo com o cofre validado.** `transactionService.ts:43` consulta `agent.vault_pubkey`, mas `:68–75` paga com `TREASURY_SECRET_KEY`. Com treasury financiada, a validação de saldo/orçamento por vault não representa a conta realmente debitada. Preservar a UI do amigo e encaminhar o pagamento ao executor por cofre.
2. **Concorrência e timeout.** `transactionService.ts:31–63` verifica consumo e insere sem lock/reserva atômica; pedidos distintos paralelos podem exceder limites. `:76–79` marca FAILED em qualquer erro, inclusive envio incerto; assinatura/bytes não são persistidos antes do broadcast.
3. **Janela e reservas.** `TransactionRepository.ts:48–55` usa dia de calendário, exclui UNKNOWN e reservas de dias anteriores. Não atende a janela móvel do PRD.
4. **Feedback do simulador.** `Simulator.tsx:127–131` gera novos IDs/hash a cada chamada e lê `result.signature`/`result.data.signature`; resposta do serviço contém `solana_signature`. Pode anunciar sucesso com assinatura undefined; deve acompanhar o estado persistido sem considerar mero sucesso HTTP confirmação.
5. **Documentação divergente.** `Docs.tsx:201–213` documenta contrato legado; `:237` usa `@agentsafe/sdk`, sem implementação desse SDK no repositório. `:273` afirma ausência absoluta de armazenamento de chave privada, incompatível com signer de teste sob custódia do backend. Manter Docs e atualizar exemplos/descrição ao contrato real, distinguindo chave Phantom de chave do cofre.
6. **Cobertura não ampliada.** A sequência não modifica arquivos de testes existentes nem migrations versionadas. O teste herdado da rota com body vazio ainda recebe501, embora body preenchido agora permita envio; não comprova que o caminho novo foi validado. Nosso backend foi validado com39 testes, frontend13 e browser com API controlada; isso não comprova a branch combinada.
7. **Conteúdo demonstrativo e navegação.** Depoimentos, preços e alegações de previsão/conformidade/multisig da landing precisam de validação do produto; não há comprovação deles no repositório. Footer exibe status operacional sem consulta, links sociais genéricos e links legais `#`. Preservar o design e ajustar o conteúdo ao que é real ou identificar claramente exemplos. O SDK dos exemplos não deve ser apresentado como pacote entregue sem evidência.
8. **Ciclo de animação.** Hero cria um intervalo de digitação, mas o cleanup remove apenas o timeout; limpar também o intervalo ao sair da landing. A nova entrada pela landing e traduções exigem atualização dos seletores/fluxos de browser tests.
9. **Contrato de idempotência.** O validator remoto aceita128 caracteres para idempotency_key, mas a coluna existente admite100. Chaves de101–128 passam na validação e falham no banco. Usar contrato coerente com schema e gerar o hash no servidor, recuperando o pedido anterior em replay.

## Integração sugerida, preservando trabalho

1. Preservar o trabalho local em commit exclusivamente na branch bernardo antes de integrar; incluir arquivos novos, hoje não rastreados. Não executar esta etapa nesta revisão.
2. Integrar a dev-jotaf inteira na bernardo, mantendo landing, assets, traduções, Docs, navegação, melhorias de modais e headers HTTP.
3. Incorporar migração0004 e módulos Payment*, manter nossas mudanças UiRepository/uiService/server/config e painel DevnetPayments. Não duplicar autenticação já incorporada pelo amigo.
4. Resolver manualmente sobreposição em `AGENTS.md`, `backend/src/app.ts` e `frontend/src/pages/VaultBudgets.tsx`. Preservar rotas/headers dele e nossos guards/rotas de pagamentos; preservar inglês e inserir o painel no layout dele. Não há colisão de nome entre os23 arquivos locais novos e arquivos alterados na sequência remota.
5. Manter o botão real do simulador, mas adaptar sua ação à API financeira segura, com ID persistido/status e strings lamports. A rota antiga não pode continuar sendo um caminho alternativo que ignora as novas garantias; definir adaptador compatível para o mesmo executor ou mantê-la explicitamente indisponível.
6. Traduzir os textos novos do painel, atualizar Docs/README para API e modelo real, ajustar testes navegador para entrada pela landing e repetir builds/testes da versão combinada.

Resultado: as entregas são complementares em grande parte. A principal sobreposição funcional exige unificar o executor financeiro, preservando a apresentação do amigo e adicionando as garantias implementadas localmente. Não há necessidade de escolher uma branch inteira e descartar a outra.
