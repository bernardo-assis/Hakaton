# Teste do painel de pagamentos Devnet

Use somente SOL da Solana Devnet. A carteira Phantom autentica o responsável; o painel usa um cofre de teste separado.

1. Abra a aplicação, conecte a Phantom e entre com a assinatura da mensagem.
2. Vá a **Vault Budgets** e encontre **Pagamentos Devnet**.
3. Clique em **Criar cofre de teste**. Confirme que o endereço exibido difere da sua carteira autenticada. Se o servidor não estiver configurado, o painel deve explicar a indisponibilidade.
4. Cadastre um agente nesse cofre em **Agent Fleet**. Ajuste os limites e os destinatários permitidos.
5. No painel de pagamentos, escolha **Aprovação manual**. Solicite um pequeno pagamento de teste. Ele deve aparecer na fila; ainda não é gasto confirmado.
6. Troque para **Automático**. O pedido anterior deve continuar na fila. Aprovar ou recusar cada pedido anterior permanece uma decisão explícita.
7. Clique em **Aprovar**. Acompanhe o status: enviado, verificando ou confirmado. A confirmação na rede pode levar tempo. Uma resposta incerta não libera o saldo reservado.
8. Confira o link **Ver na Solana Devnet** quando houver assinatura. **Gasto em 24 horas** inclui pagamentos finalizados e taxas efetivamente cobradas, inclusive de transferências que falharam na rede; valores ainda reservados aparecem separados.
9. Recuse outro pedido manual e confira o histórico. Teste um destinatário fora da lista e um valor acima do limite; o backend deve bloquear.
10. Use o botão de pânico existente. Agentes/cofres congelados não devem enviar novos pagamentos.
11. Atualize a página e confira que cofre, modo, fila e histórico persistem. Troque a carteira ou saia e confirme que os dados da sessão anterior desaparecem.
12. Em tela estreita (390 px), confira formulário, fila e histórico sem cortes no painel de pagamentos.

## Validação automatizada desta entrega

- Helpers de pagamentos: testes executados com falha antes da implementação e aprovados depois; estado desconhecido/aprovação pendente nunca se transforma em confirmação, valores convertidos para lamports inteiros, Explorer restrito à Devnet.
- `npm test` no container frontend: 13 testes aprovados.
- `npm run build` no container frontend: aprovado.
- `frontend/tests/e2e/payments-browser.cjs`: fluxo com API simulada e carteira injetada, sem fundos ou transmissão na rede; executar com Playwright disponível em `/tmp/qa/node_modules/playwright` e aplicação em `localhost:5173`.

A simulação de navegador comprova a interação do painel. Não substitui uma transferência e confirmação reais na Devnet.

### Navegador validado pelo orquestrador

O fluxo inicial passou em desktop e mobile com carteira injetada e endpoints simulados: troca manual/automático, fila anterior preservada, envio pela sessão do proprietário com cabeçalho CSRF, aprovação seguida de estado incerto sem confirmação falsa, e nenhum erro de execução. Captura: `/tmp/payments-mobile.png` no container `agentsafe_qa_browser`.

O orquestrador executou também a versão ampliada do script: endereço completo do destinatário, retenção da edição do limite durante atualização periódica, paginação com 101 pedidos e status de recusa passaram. Saída: `PASS modes queue owner CSRF unknown mobile zero errors`, exit 0. Não houve transmissão ou fundos reais.

Lint: zero erros e nove avisos de React, incluindo avisos sobre efeitos e referências; build e 13 testes passaram após os ajustes finais.
