# Guia de teste local das telas

Abra http://localhost:5173. Use apenas Solana Devnet e valores de teste. Estes são cenários de aceite; a conclusão depende da validação da implementação.

## Inicialização neste ambiente

Os containers locais já foram preparados. Não é necessário Node.js no host.

```bash
docker start agentsafe_pg
docker exec agentsafe_pg pg_isready -U agentsafe -d agentsafe_db
docker start agentsafe_backend_local agentsafe_frontend_local
```

Espere o banco responder que aceita conexões antes de iniciar os outros containers. Confira `docker logs agentsafe_backend_local` e `docker logs agentsafe_frontend_local` caso a página não abra. O proxy local está configurado em `frontend/.env.local` com `VITE_API_PROXY_TARGET=http://agentsafe_backend_local:3001`; os containers precisam compartilhar a rede Docker. Reinicie o frontend quando mudar esse arquivo.

Para interromper:

```bash
docker stop agentsafe_frontend_local agentsafe_backend_local agentsafe_pg
```

Não execute `backend/setup.js` para testar: ele não é necessário para esta validação e pode sobrescrever código e configuração. Conectar Phantom não autentica usuário; o ambiente atual é um protótipo local sem isolamento multiusuário.

## 1. Overview

1. Clique Overview. Com banco vazio, confira estado vazio e ausência de transações inventadas.
2. Cadastre um cofre e um agente nas telas correspondentes. Volte ao Overview e confira os registros.
3. Compare saldo e histórico com a resposta da API na aba Rede do navegador: os pedidos de dados devem ir para `/api`, nunca diretamente ao banco.
4. Pesquise um identificador real e depois um texto inexistente; o segundo deve resultar em lista vazia. Teste os filtros.
5. Abra depósito/saque e tente vazio, zero, negativo e endereço inválido; nenhum deve gerar sucesso.
6. Depósito solicita faucet Devnet, sujeito à disponibilidade externa. Saque e transferência real estão indisponíveis neste protótipo e devem informar isso. Uma falha não pode aumentar o saldo exibido.

## 2. Header

1. Abra notificações: confira eventos reais ou aviso de lista vazia.
2. Sem Phantom instalado, clique conectar e confira orientação clara.
3. Com Phantom, recuse a solicitação: conexão deve permanecer desativada.
4. Aceite a solicitação e confira o endereço; desconecte e confirme a mudança. Nunca forneça frase secreta.

## 3. AI Simulator

1. Sem agente elegível, confira orientação para cadastrar/configurar um.
2. Inicie e dispare uma ação dentro dos limites. O log deve refletir a resposta real da API: SIMULATION / NOT_SUBMITTED. A avaliação não envia SOL, não cria pagamento liquidado e consome somente o orçamento diário do simulador.
3. Dispare ação acima dos limites: deve ser bloqueada pelo backend, sem debitar saldo.
4. Pare e tente disparar: não deve haver nova solicitação de gasto.
5. Clique Limpar terminal e confira que apenas a exibição local foi limpa. As avaliações aprovadas continuam consumindo o orçamento diário do simulador até a virada do dia UTC; gastos e histórico persistidos não são apagados.

## 4. Agent Fleet

1. Crie um agente com nome identificável de teste, carteira Devnet válida e limites positivos.
2. Atualize a página: o agente deve continuar presente.
3. Pesquise pelo nome e teste filtros. Abra gerenciamento, ajuste um limite e atualize a página.
4. Pause o agente e confira que nova tentativa de pagamento é bloqueada; retome e confira estado.
5. Tente valores inválidos e carteira inválida; a API deve rejeitar sem criar registros parciais.
6. Teste parada de emergência somente num ambiente de teste: todos os agentes abrangidos devem ficar pausados.

## 5. Vault Budgets

1. Confira estado vazio sem cofres cadastrados.
2. Crie um cofre e atualize a página para verificar persistência.
3. Ajuste o orçamento de um agente; confirme a atualização em Fleet, Simulator e Overview.
4. Teste valor negativo, formato inválido e limite por transação acima do limite diário; confira erro claro. Reduzir o limite diário abaixo do consumo deve bloquear próximas simulações, sem apagar histórico.
5. Clique Configurar política para ajustar valores de saldo mínimo e aprovação; teste os três controles de regras. Eles bloqueiam avaliações quando a condição não é atendida; não existe aprovação humana por 2FA implementada.
6. Clique Recomendação de liquidez: deve apresentar uma recomendação baseada em regras e informar que não houve transferência. Clique Exportar e abra o arquivo baixado.

## Falhas e aparência

Interrompa temporariamente a API e recarregue: deve aparecer erro e possibilidade de tentar novamente, sem registros fictícios. Religue a API. Compare as quatro telas em desktop e janela estreita: layout, cores e componentes existentes devem ser preservados; formulários e estados novos devem seguir o estilo atual.

Registre tela, botão, passos, resultado e mensagem de erro para qualquer falha. Remova somente registros identificados como seus testes; não limpe o banco inteiro.

## Resultado QA em 2026-10-09

O fluxo das quatro telas passou em Chromium com API real e banco PostgreSQL: cadastro, edição, pausa/retomada, emergência, whitelist, simulador, notificações, políticas, exportação e recomendação. Não houve erros JavaScript no smoke principal. Capturas desktop comparadas com o baseline preservam o estilo existente. Registros de teste foram removidos especificamente.

A interface Phantom foi testada sem extensão e com provider fictício injetado para recusa/conexão/desconexão. Conectar uma extensão Phantom real e assinar mensagens continuam sendo verificações manuais; nenhum pagamento nem faucet externo foi executado durante QA. O simulador apenas avalia regras no backend. Limite de requisições pode apresentar HTTP 429 durante muitos testes repetidos: aguarde a janela antes de tentar novamente.
