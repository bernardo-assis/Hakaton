# Publicação do AgentSafe

Revisão em 12/10/2026 do código de `origin/main`, commit `1dd108f`. O site público é **https://agentsafe.kernellabs.uk/**. O usuário informa que ele está em uma VPS; os testes HTTP confirmam que o domínio responde por HTTPS e que a API de sessão está acessível pelo mesmo domínio. Nesta revisão não houve acesso SSH, alteração da VPS, implantação, assinatura de carteira ou envio de pagamentos.

O código analisado e a versão instalada são evidências diferentes. O servidor não fornece um identificador de commit; portanto, esta revisão não certifica que a imagem publicada corresponde exatamente a `1dd108f`. O horário `Last-Modified` e o nome de um arquivo JavaScript identificam um artefato, mas não substituem a identificação de versão.

## 1. Como o navegador chega ao aplicativo

O frontend é React com Vite. Sua imagem de produção serve arquivos estáticos em Nginx na porta interna 8080. Requisições para `/api/...` passam pelo Nginx, que encaminha para `backend:3001`. O backend usa Express e PostgreSQL. O executor consulta a Solana Devnet e usa o signer do cofre de teste, separado da carteira Phantom de login.

```text
Navegador → HTTPS no domínio público → frontend Nginx
                                     ├── HTML, CSS, JavaScript e imagens
                                     └── /api → backend Express → PostgreSQL
                                                              → Solana Devnet
```

A configuração exata de TLS, redes, serviços e volumes da VPS ainda precisa ser inventariada. A memória da `main` menciona Docker Swarm/Traefik, `network_swarm_public` e `agentsafe_internal`, mas **não existe manifesto Swarm/Traefik versionado nessa revisão**. Esses nomes são relato histórico, não resultado de inspeção do servidor. O [runbook da VPS](VPS_RUNBOOK.md) lista como registrar a instalação real.

## 2. O que foi confirmado no domínio

| Verificação pública | Resultado em 12/10/2026 | O que prova |
|---|---|---|
| HTTP `/` | 301 para HTTPS | Redirecionamento do acesso inicial |
| HTTPS `/` | 200, HTML | Frontend entregue pelo domínio |
| `/api/auth/session` sem cookie | 200, `authenticated: false` | API de sessão responde sem inventar login |
| `/healthz` | 200, texto `ok` | Nginx do frontend vivo |
| `/readyz` | 200, HTML da landing | Fallback SPA; **não verifica banco nem backend** |
| Cabeçalhos da API de sessão | `no-store`, HSTS, `nosniff`, `DENY` | Defesas HTTP observadas nessa resposta |

A raiz HTML ainda contém `<title>frontend</title>`. O certificado foi aceito normalmente pelo cliente HTTPS; expiração, renovação automática e configuração do emissor não foram inspecionadas. Os testes não comprovam login real pela Phantom, cookie autenticado, pagamento finalizado, restauração de backup ou tolerância a reinício na VPS.

## 3. Arquivos disponíveis no repositório

| Arquivo | Uso |
|---|---|
| `backend/Dockerfile` | Node 22 Alpine, build em estágios, dependências de produção, usuário `node`, migrações no startup, health `/readyz` |
| `frontend/Dockerfile` | Build Vite e Nginx sem privilégio, porta 8080, health `/healthz` |
| `frontend/deploy/default.conf` | Proxy `/api/` para backend privado e fallback SPA |
| `compose.demo.yml` | Demo local, banco/API sem porta pública, frontend em loopback, segredos montados, volume próprio |
| `scripts/demo.sh` | Bootstrap, subir/parar, status e logs da demo |
| `docker-compose.yml` | Setup antigo PostgreSQL/Adminer com portas 5432/8080 e senha de exemplo; **não usar como instalação pública** |
| `render.yaml`, `frontend/vercel.template.json` | Alternativas preparadas; não descrevem a VPS atual |

As imagens do demo têm build em estágios. Backend e frontend rodam sem root; o Compose local define filesystem somente leitura, `/tmp` temporário, capabilities removidas e `no-new-privileges`. Isso não prova que a VPS mantém essas opções. O Compose demo não define limites de CPU/memória; registrar e validar esses limites no ambiente público é pendência de operação.

## 4. Configuração do backend

| Variável | Significado e configuração esperada |
|---|---|
| `NODE_ENV` | `production` na VPS para cookies Secure e comportamento de produção |
| `PORT` | Porta interna da API, padrão 3001 |
| `DATABASE_URL` / `DATABASE_URL_FILE` | Conexão privada PostgreSQL; `_FILE` lê segredo montado e tem precedência |
| `DATABASE_SSL` | `true` exige TLS com certificado verificado; rede privada Docker difere de banco externo |
| `AUTH_ALLOWED_ORIGINS` | Origem exata `https://agentsafe.kernellabs.uk`, sem barra/caminho; outras só se usadas |
| `TRUST_PROXY_HOPS` | Apenas 0 ou 1; confirmar proxy imediato confiável, sem ampliar para cadeia arbitrária |
| `SOLANA_RPC_URL` | RPC Devnet; executor valida a rede antes de assinar/enviar |
| `DEVNET_PAYMENTS_ENABLED` | Padrão `false`; `true` ativa execução e recuperação Devnet |
| `VAULT_SIGNER_ENCRYPTION_KEY` / `_FILE` | Exatamente 32 bytes aleatórios em base64, estáveis, externos ao Git |

Não colocar senha, chave do signer ou token de agente em `VITE_*`, build args, imagens, prints ou commits. A chave mestre cifra os signers armazenados no banco. **Banco e chave precisam ser preservados juntos.** Gerar outra chave no redeploy não recupera os cofres existentes. O bootstrap local preserva os arquivos existentes em `.demo-secrets/`; as permissões locais não representam automaticamente o armazenamento da VPS.

Ativar pagamentos não financia o cofre nem aprova a fila manual. O reconciliador inicia com o processo e roda a cada 15 segundos quando habilitado, podendo reenviar os mesmos bytes de operações previamente autorizadas e ainda incertas. Antes de habilitar uma instalação existente, revisar pedidos e reservas persistidos. Os cofres são exclusivamente Devnet.

## 5. Sessões, proxy e limites HTTP

Manter fetches relativos `/api/...`: o navegador vê frontend/API sob a mesma origem. Mutações do proprietário exigem origem permitida e `X-AgentSafe-CSRF: 1`. Login assina uma mensagem; não entrega a chave da Phantom nem autoriza debitar essa carteira. A sessão usa cookie HttpOnly, SameSite=Strict e Secure em produção.

No Nginx versionado, `X-Forwarded-For` recebe o endereço do proxy imediato e `X-Forwarded-Proto` recebe `$scheme` da conexão interna. Atrás de outro terminador TLS, esse valor pode ser `http` embora o usuário esteja em HTTPS. A configuração decide o cookie Secure por `NODE_ENV`, mas a cadeia de endereço/protocolo deve ser inspecionada. Não confiar indiscriminadamente no cabeçalho recebido do cliente. Se a cadeia agrupa usuários no endereço do proxy, limites por IP podem ser compartilhados.

Os limites do código são por minuto e em memória de cada processo: 240 leituras GET/HEAD, 100 mutações gerais, 60 mutações de autenticação e 30 mutações financeiras. São camadas cumulativas; não um limite distribuído entre réplicas. O polling normal usa orçamento de leitura. Antes de aumentar um limite, conferir polling e IP reconhecido.

## 6. Inicialização, migrações e saúde

A imagem executa `node scripts/start.cjs`: aplica migrações PostgreSQL numeradas e só então carrega o servidor. `npm run migrate` e `npm run start:production` são os comandos equivalentes após build, fora do Docker.

O runner mantém `public.schema_migrations` com SHA-256 e trava consultiva PostgreSQL. Arquivo aplicado ausente ou modificado recusa startup; alterações exigem nova migração numerada. Banco legado completo sem histórico é comparado a um schema de referência antes do baseline; schema parcial é rejeitado. Não executar o schema SQLite histórico sobre PostgreSQL.

No backend, `/healthz` é liveness JSON e `/readyz` faz `SELECT 1`, retornando 503 se o banco não responder. Não testa RPC, saldo, chave do signer nem finalização Solana. O proxy atual publica só `/api`; portanto, `/readyz` no domínio não chega ao backend. Monitorar readiness **dentro da rede privada** até existir roteamento explícito revisado. Uma URL privada protegida com 403 ou fallback HTML com 200 não representa prontidão do banco.

No Swarm, não pressupor a ordem de `depends_on` do Compose local. Falha inicial de DNS/banco deve ser tratada por readiness e política de reinício observada; não é evidência de ausência de cold start. Atualizações podem interromper solicitações, cujo resultado deve ser conciliado pelos mesmos IDs/assinaturas persistidos.

## 7. Rodar a demo local

Requisitos: Docker/Compose v2; Node não é obrigatório no host.

```sh
./scripts/demo.sh bootstrap
./scripts/demo.sh up
./scripts/demo.sh status
```

Acesse **http://localhost:8088**. Para logs ou parada preservando o volume:

```sh
./scripts/demo.sh logs
./scripts/demo.sh down
```

`DEMO_HTTP_PORT` pode ser configurado em `.env.demo`, ignorado pelo Git. A demo usa projeto `agentsafe-demo`, volume próprio e não substitui `agentsafe_pg`. Pagamentos vêm desativados. A configuração HTTP local não deve ser copiada como configuração HTTPS de produção.

## 8. Atualização e continuidade na VPS

Antes de atualizar: identificar release instalada, manifesto real, serviços/rede/volume, backup restaurável e mesma chave. Registrar migrations/release e revisar pedidos incertos. Construir imagens de versão identificável; aplicar mudança ao AgentSafe sem reiniciar outros serviços da VPS. Depois validar readiness interna, domínio, login real, persistência e pequena transferência Devnet autorizada com assinatura finalizada. Não criar uma segunda intenção para resolver a primeira incerta.

Troca de imagem não desfaz migrações. Rollback precisa de compatibilidade do schema, e restauração de snapshot antigo perde dados posteriores. Não usar `down -v`, apagar volumes, renovar chave ou limpar tabelas para resolver startup.

O procedimento de backup, restauração isolada, investigação de erros e evidências pendentes está em [VPS_RUNBOOK.md](VPS_RUNBOOK.md). O [roteiro de teste do aplicativo](PUBLISHED_APP_MANUAL_TEST_PT.md) cobre uso com Phantom e Devnet.

## 9. Alternativas e evidências históricas

Vercel/Render/Railway são caminhos alternativos, não serviços confirmados na publicação atual. Se selecionados futuramente, revisar planos/custos/TLS e manter API na mesma origem. `scripts/configure-vercel.cjs` aceita origem HTTPS e gera rewrite; não publicar o hostname `.invalid` do template. Nenhuma mudança de hospedagem foi feita nesta revisão.

A validação local anterior registrou imagens saudáveis, fixture persistida após recriação, migrações repetíveis, autenticação Ed25519 com provider injetado e testes de API. Essas evidências históricas não certificam VPS, Phantom real ou liquidação Devnet. A revisão de 12/10 complementa com leitura da `main`, HTTP público e inspeção anônima de navegador, sem movimentação de fundos.
