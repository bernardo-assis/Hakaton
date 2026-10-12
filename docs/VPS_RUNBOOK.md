# Operação da VPS e recuperação

Atualizado em 12/10/2026. Site: https://agentsafe.kernellabs.uk/. Base de código: `origin/main` em `1dd108f`. Este é um procedimento para o responsável pela instalação; **não houve execução de backup, restore, redeploy ou envio na VPS nesta revisão**.

## 1. Identificar a instalação antes de agir

Não há manifesto Swarm versionado. Preencher o inventário abaixo com acesso autorizado ao servidor, sem colocar valores de segredos neste arquivo:

| Informação | Situação nesta revisão |
|---|---|
| Host SSH, usuário e responsáveis | Não fornecidos |
| Commit, tags e digests de imagens instaladas | Não confirmados |
| Manifesto/stack e procedimento de atualização | Não fornecidos; memória menciona Swarm/Traefik |
| Nomes dos serviços, número de réplicas e nós | Não confirmados |
| Rede privada backend/banco e ingresso HTTPS | Não inspecionados |
| Volume PostgreSQL, nó de armazenamento e espaço | Não inspecionados |
| Cofre de segredos/chave mestre e custódia do backup | Não inspecionados |
| CPU/memória, restart policy e retenção de logs | Não inspecionados |
| Certificado, renovação, alertas e firewall | Não inspecionados |
| Frequência, retenção, local externo e restauração do backup | Não comprovados |

Em Swarm, usar comandos de leitura no manager para localizar a instalação:

```sh
docker stack ls
docker service ls
docker service ps NOME_REAL_DO_SERVICO --no-trunc
docker service inspect NOME_REAL_DO_SERVICO --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
docker service inspect NOME_REAL_DO_SERVICO --format '{{json .Spec.TaskTemplate.Resources}}'
docker service inspect NOME_REAL_DO_SERVICO --format '{{json .Spec.TaskTemplate.RestartPolicy}}'
```

Os nomes em maiúsculas são placeholders, não comandos prontos com nomes reais. Não publicar `docker inspect` inteiro, `env`, URL de banco ou conteúdo de `/run/secrets`: podem conter credenciais. Não editar o Swarm, firewall ou Traefik compartilhado sem conhecer os outros serviços.

Registrar digest da imagem, commit do build e release implantada resolve a diferença entre “main pronta” e “essa versão instalada”. Manter o manifesto sem segredos versionado permite revisão e reprodução.

## 2. Verificar saúde em três camadas

1. **Site:** HTTPS `/` entrega HTML; HTTP redireciona para HTTPS.
2. **API:** `/api/auth/session` responde JSON com `authenticated:false` numa sessão anônima. Isso confirma a rota, não o login.
3. **Backend/banco:** `/readyz` no container backend retorna JSON `ready` e 200; 503 indica banco indisponível. RPC e signer são dependências separadas.

```sh
curl -sS --max-time 15 https://agentsafe.kernellabs.uk/api/auth/session
docker exec CONTAINER_BACKEND_REAL node -e "fetch('http://127.0.0.1:3001/readyz').then(async r=>{console.log(r.status,await r.text());if(!r.ok)process.exitCode=1}).catch(()=>process.exitCode=1)"
docker exec CONTAINER_POSTGRES_REAL pg_isready -U USUARIO_REAL -d BANCO_REAL
```

Adaptar a porta se `PORT` for diferente. No Swarm, identificar o container da tarefa no nó correto; nome de serviço não é nome de container. Em 12/10, `/healthz` público respondeu texto `ok` do frontend, e `/readyz` público respondeu HTML com 200 pelo fallback SPA. Não usar esse 200 como disponibilidade PostgreSQL. Uma rota privada exigindo autenticação e respondendo 403 também não equivale à prontidão.

Após atualização, validar login Phantom real, restauração de sessão e logout no domínio; no navegador, inspecionar flags do cookie sem copiar seu valor. Conferir HttpOnly/Secure/SameSite=Strict, origem permitida e CSRF. Não criar sessão de usuário falsa para “aprovar” a VPS.

## 3. Backup: o que precisa ser salvo

Um dump do banco preserva cofres, políticas, pedidos, reservas, assinaturas, auditoria e histórico de migrações. As chaves privadas dos cofres ficam cifradas; **o dump sozinho não basta**. Salvar de maneira segura a mesma `VAULT_SIGNER_ENCRYPTION_KEY`, credenciais necessárias, manifesto sem segredos e identificadores da release. Guardar a chave em armazenamento protegido e separado; nunca em Git, ticket, logs ou pasta pública.

Definir frequência e retenção conforme perda de dados aceitável; manter cópia externa à própria VPS e testar a restauração. Um arquivo salvo no mesmo disco não protege contra perda da VPS. O dump pode conter dados sensíveis e deve ter acesso restrito e criptografia no armazenamento/transporte.

Exemplo de backup lógico, **apenas depois de substituir nomes e escolher diretório privado no servidor**:

```sh
umask 077
docker exec CONTAINER_POSTGRES_REAL pg_dump -U USUARIO_REAL -d BANCO_REAL -Fc --no-owner --no-acl > CAMINHO_PRIVADO/agentsafe-release-data.dump
sha256sum CAMINHO_PRIVADO/agentsafe-release-data.dump > CAMINHO_PRIVADO/agentsafe-release-data.dump.sha256
```

Checar código de saída e arquivo não vazio. `pg_dump` fornece snapshot consistente do banco, mas não congela o executor nem a blockchain. Registrar UTC e operações pendentes junto do backup. Backup deve incluir somente o banco AgentSafe; não presumir que um comando para todo o cluster é seguro em VPS compartilhada. Exportar usuários/roles, se necessário, exige procedimento específico de custódia e não impressão de senhas.

Não copiar a pasta ativa do volume PostgreSQL como se fosse backup físico consistente. Não apagar o volume após dump sem restauração verificada. Não gerar nova chave mestre para “atualizar a segurança” mantendo cofres cifrados com a chave antiga.

## 4. Restauração de ensaio, isolada da produção

1. Validar checksum e identificar release e chave correspondentes.
2. Criar um PostgreSQL de teste **em rede/volume separado**, sem acesso de outros serviços e sem porta pública.
3. Restaurar num banco vazio do ensaio; nunca no banco vivo para testar.
4. Iniciar backend da release correspondente contra esse banco com `DEVNET_PAYMENTS_ENABLED=false`, a mesma chave mestre e origem local de ensaio.
5. Verificar migrations, políticas, quantidade de registros e pedidos por status. Validar decifragem de um cofre pelo procedimento privado do responsável; readiness sozinha não verifica decifragem.
6. Confirmar que o teste não transmitiu operações; registrar resultado, horário e checksum. Não divulgar dados/chaves do backup.

Com o container/banco de ensaio já provisionados e vazios:

```sh
docker exec -i CONTAINER_POSTGRES_ENSAIO pg_restore -U USUARIO_ENSAIO -d BANCO_ENSAIO --no-owner --no-acl --exit-on-error < CAMINHO_PRIVADO/agentsafe-release-data.dump
docker exec CONTAINER_POSTGRES_ENSAIO psql -U USUARIO_ENSAIO -d BANCO_ENSAIO -c 'SELECT name, checksum, applied_at FROM public.schema_migrations ORDER BY name;'
```

Não incluir `--clean` contra uma instalação real. Os papéis de aplicação devem existir no ensaio; `--no-owner` não restaura grants automaticamente. O ensaio precisa comprovar permissões necessárias à aplicação. Um dump que lista conteúdo mas nunca foi restaurado permanece backup não comprovado.

## 5. Recuperação real após falha

Antes de substituir banco ou ativar recovery, bloquear novas solicitações de pagamento no ingresso e desativar execução em todos os workers pelo procedimento real do ambiente. **Não tratar `UNKNOWN` como erro definitivo e não zerar reservas.** Escolher último backup válido e avaliar quais pedidos/transmissões ocorreram depois dele.

Restaurar snapshot antigo pode remover pedidos que já foram enviados ou finalizados on-chain. Idempotência protege os registros que ainda existem; não recria registros perdidos por restore. Conciliar assinaturas, registros restantes, logs protegidos e estado Solana antes de reabrir operações. Se faltar evidência, manter o executor desabilitado e investigar. Não assinar/submeter uma nova transferência para substituir uma incerta.

Manter a chave correspondente ao dump. Após subir backend e banco, checar readiness, migrations, cofre e reservas. Reativar execução só depois da revisão das operações e credenciais: recovery pode retransmitir os mesmos bytes autorizados. Aprovação pendente continua exigindo aprovação; trocar para automático não libera a fila antiga.

Este procedimento ainda precisa de ensaio na infraestrutura real, com responsável, janela e critérios documentados. Não há evidência de recuperação física da VPS nesta revisão.

## 6. Atualizar sem perder dados

1. Registrar release/digest, volumes, migrations aplicadas e configuração não secreta.
2. Fazer backup e confirmar último ensaio de restore.
3. Revisar migrations novas e compatibilidade de rollback; manter chave estável.
4. Fazer build/versionamento de imagens e aplicar pelo manifesto real do AgentSafe.
5. Observar tarefas, startup/migrations e readiness; só então validar domínio e login.
6. Conferir persistência e pedidos anteriores; verificar pago por assinatura finalizada, não por toast de solicitação registrada.

No Swarm, o `depends_on` do demo não garante ordem de inicialização. Conferir política de reinício, healthcheck, réplicas, recursos e colocação do volume em nó adequado. Um volume local de um nó não é automaticamente compartilhado entre nós. O modo de atualização e capacidade de rollback dependem do manifesto ausente; não há comando `stack deploy` com arquivo real neste runbook.

## 7. Investigar erros sem repetir pagamento

| Sintoma | Investigação |
|---|---|
| Deposit SOL retorna 500 | Registrar horário/cofre, consultar saldo e assinatura; faucet pode ter aceitado antes de falhar confirmação. Correlacionar logs da VPS, não logs locais |
| `RECIPIENT_NOT_ALLOWED` | Conferir endereço completo na allowlist do agente selecionado; chave válida não significa destinatário autorizado |
| `VAULT_DAILY_CAP_EXCEEDED` | Somar principal confirmado nas últimas 24h, reservas e taxas; saldo disponível não aumenta limite |
| Solicitação registrada: bloqueada | O histórico visual não mostra `error_code` nesta versão. Consultar o pedido original na API autenticada ou solicitar investigação pelo ID à equipe; não houve envio desse pedido, e aumentar limite não o envia automaticamente |
| `UNKNOWN` ou transporte perdido | Consultar pedido original e assinatura, preservar reserva/idempotência; não criar nova intenção |
| Pagamentos desabilitados | Confirmar opt-in do ambiente e chave, revisar recovery antes de habilitar |
| 401 / 403 | Sessão/expiração, cookie, origem e CSRF; não remover autenticação para resolver |
| 429 | Ver polling, IP reconhecido e separação leitura/mutação; replicas usam contadores locais |
| Backend recusa startup | Conferir segredo, conexão privada e migrations/checksums; não editar migration aplicada |

Logs devem ser curtos e do serviço AgentSafe/horário pertinente:

```sh
docker service logs NOME_REAL_BACKEND --since 10m --tail 100
```

Não colocar logs brutos com dados de usuário ou credenciais em documentação pública. Limitar retenção/rotação evita lotar disco. Monitorar espaço de volume, reinícios, readiness, 5xx/429, certificado e falhas de RPC/recovery; configurar alertas com responsável, sem pressupor que existam.

## 8. Evidências que ainda faltam

- Manifesto real da VPS sem segredos, imagens identificadas e política de atualização.
- Backup externo com restauração bem-sucedida, mesma chave e conciliação após snapshot.
- Saúde interna banco/backend, armazenamento, firewall, limites de recursos e alertas.
- Phantom real, cookies Secure, troca de carteira e logout na instalação publicada.
- Pequeno pagamento Devnet finalizado com destinatário/valor/assinatura conferidos e recovery validado em ambiente controlado.

Os itens são verificações pendentes; não afirmam que essas configurações estão ausentes na VPS. As falhas observadas publicamente, como readiness em fallback HTML, estão documentadas separadamente do que depende de SSH.
