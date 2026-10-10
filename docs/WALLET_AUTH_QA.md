# Validação da autenticação por carteira

Escopo: assinatura de login, sessão e isolamento por proprietário. Pagamentos continuam desabilitados. Estado: backend e integração de navegador aprovados; extensão Phantom real permanece pendente de teste manual.

## Critérios de aceite

- [x] Desafio contém nonce imprevisível, carteira, domínio/URI, expiração e aviso de que não transfere fundos.
- [x] Assinatura Ed25519 válida autentica; assinatura incorreta ou de outra carteira não autentica.
- [x] Desafio expirado, consumido ou alterado é rejeitado; concorrência permite apenas uma sessão.
- [x] Cookie de sessão HttpOnly, atributos apropriados e token armazenado somente como hash.
- [x] Expiração invalida acesso na API; logout e troca de conta removem dados da UI e revogam sessão.
- [x] Origin indevida e mutação sem proteção CSRF são rejeitadas.
- [x] Sem sessão, todas as rotas de dados respondem sem expor registros.
- [x] Duas carteiras: listagens, dashboard, notificações e histórico mostram somente registros próprios.
- [x] Cofres, agentes, whitelist, políticas, optimize, faucet, history e simulator não permitem IDs de outra conta; objeto alheio retorna erro genérico.
- [x] Panic congela somente agentes próprios. Onboarding deriva proprietário da sessão e não aceita identidade arbitrária.
- [x] Cadastro legacy de usuário não permite bypass com password_hash/user_id enviados pelo cliente.
- [x] Postman collection importável acompanha contrato final, cookies e exemplos sem segredos.
- [x] Browser testa provider ausente, recusa, login, logout e account switch sem dados anônimos.

## Como as evidências serão produzidas

Assinaturas reais Ed25519 geradas em fixtures locais únicas testam a API com PostgreSQL e HTTP em execução. Isso prova validação criptográfica da assinatura, mas não testa uma extensão Phantom real. O navegador usa provider injetado somente para o contrato da interface. Não serão pedidos fundos, chave privada ou frase secreta do usuário.

Postman não assina pela extensão Phantom por conta própria: a verificação depende de assinatura produzida por carteira/provider ou fixture de teste. Não considerar conexão de extensão prova de login. Nenhuma assinatura de autenticação autoriza pagamentos.

Fixtures serão removidas pelo identificador único, sem apagar dados existentes. Backend: build e 17 testes aprovados pelo orquestrador. Smoke HTTP independente executado pelo orquestrador com 53 requisições aprovou assinatura válida/incorreta, binding ao navegador, replay, concorrência, expiração, Origin, CSRF, logout, isolamento de duas contas e panic restrito. Fixtures próprias removidas. Revisão confirmou token hash no PostgreSQL e cookie HttpOnly/SameSite Strict no navegador. Browser final passou com provider injetado e assinatura Ed25519 real: ausência da extensão, recusa A/B, login A/B, restauração, troca de conta, logout e dashboard 401 sem dados privados. Zero erros JavaScript. A troca mantém exatamente um cabeçalho e elimina o endereço anterior; regressão de chaves React duplicadas reproduzida antes da correção. Frontend build e nove testes aprovados. A extensão Phantom real não foi testada e nenhuma transferência foi habilitada.

Limitação adicional: a espera de oito horas para expiração automática na interface não foi executada; expiração no servidor foi validada com timestamps de fixtures. HTTPS/cookie Secure de produção exige validação no ambiente de implantação.
