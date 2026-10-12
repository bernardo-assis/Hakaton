# Entrar com a carteira e conferir privacidade

Revisado em 12/10/2026 para main `1dd108f`. Estes são critérios de aceite, não resultados executados na VPS. O login separa os dados de cada carteira e não autoriza o servidor a movimentar a Phantom; pagamentos usam o cofre separado. Veja [guia completo](USER_GUIDE_PT.md).

1. Abra https://agentsafe.kernellabs.uk/ (publicado), http://localhost:8088 (demo Docker) ou http://localhost:5173 (ambiente de desenvolvimento). Clique Launch App. Antes do login, o conteúdo privado deve ficar oculto; Docs continua público.
2. Com Phantom instalada, clique **Connect Phantom Wallet**. Confira a mensagem: ela deve indicar login, carteira, origem e prazo, sem transferência de fundos.
3. Recuse a assinatura. O aplicativo deve permanecer sem acesso aos dados.
4. Tente novamente e aceite a assinatura. Só depois da confirmação do servidor as telas devem abrir.
5. Cadastre seu cofre e agente. Atualize a página: os dados próprios podem ser restaurados quando a carteira correspondente está conectada.
6. Troque de conta na Phantom. Os dados anteriores devem desaparecer imediatamente. Entre com a segunda conta: ela não deve ver os cofres ou agentes da primeira.
7. Clique para sair da sessão. O conteúdo deve desaparecer; atualizar a página não pode recuperar acesso com a sessão encerrada.
8. Sem extensão Phantom, o aplicativo deve orientar a instalação e nunca simular login.

Se a assinatura expirar, solicite outra. Não informe chave privada nem frase de recuperação. A mensagem de login não é uma transação Solana.

## Postman

Importe `docs/postman/wallet-auth.postman_collection.json`. Configure `base_url`, `origin` e sua chave **pública** na coleção. No site, ambos os endereços são `https://agentsafe.kernellabs.uk`; em desenvolvimento, API `http://localhost:3001` e Origin `http://localhost:5173`. Mantenha o gerenciamento de cookies habilitado e envie `Origin`, `Content-Type: application/json` e `X-AgentSafe-CSRF: 1` nas mutações. A coleção já inclui esses cabeçalhos; não invente uma origem fora da configuração do servidor.

Execute Emitir desafio. A mensagem exata deve ser assinada por carteira/provider; Postman não acessa a extensão Phantom para assinar automaticamente. O campo de assinatura da verificação usa base64 de 64 bytes. Não use uma assinatura inventada nem forneça segredos. Para executar testes totalmente automáticos, o time usa fixtures de teste com Ed25519; isso não substitui a carteira de produção.

Execute Verificar assinatura no mesmo gerenciamento de cookies do desafio, depois Consultar sessão. As pastas de falhas e isolamento explicam suas pré-condições; não execute a coleção inteira sem respeitá-las. O desafio só pode ser usado uma vez e expira em cinco minutos. Por fim, execute logout e confira que Dashboard anônimo retorna 401.

Para testar duas contas, mantenha sessões separadas. Um identificador de cofre/agente da segunda conta deve retornar 404 quando solicitado pela primeira, sem revelar informações.

## Evidência histórica de validação

Backend validado com assinatura real Ed25519 de fixtures locais e duas contas. Interface validada em Chromium com provider injetado e assinaturas Ed25519 reais: recusa, login, restauração, troca de conta e logout passaram sem dados privados anônimos. Extensão Phantom real continua pendente de verificação manual. Nenhum fundo foi movimentado.

## Registro de aceite publicado

Registre revisão/ambiente, duas carteiras públicas de teste, horário, comportamento esperado/obtido e estado de cada cenário. Provider injetado e assinatura Ed25519 real são evidência de integração local, sem comprovar extensão Phantom real, configuração da VPS ou liquidação Devnet. Nunca registre cookies, tokens ou chaves privadas no relatório.
