# 🧪 Guia Definitivo de Testes no Postman (Backend)

Este guia foi desenhado para ser "Copiar e Colar" no Postman. Siga a ordem exata, pois um passo depende da ID gerada no passo anterior.

---

## 🛑 Pré-requisito
Antes de abrir o Postman, certifique-se de que o servidor e o banco estão rodando.
No terminal, dentro da pasta do projeto:
1. `docker-compose up -d` (Para ligar o Banco)
2. `cd backend`
3. `npm run dev` (Para ligar a API na porta 3001)

---

## Passo 1: Criar o seu Usuário (A Conta Web2)
Primeiro, precisamos criar o seu login tradicional para proteger a conta.

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/users`
* **Headers:** `Content-Type: application/json`
* **Body (Selecione "raw" e "JSON"):**
```json
{
  "email": "jotaf@colosseum.com",
  "password": "senha_segura_123",
  "company_name": "AIO Dev Team"
}
```
🎯 **O que você deve fazer:** Aperte *Send*. Na resposta, a API vai te devolver os dados criados. **Copie o `id`** que ela gerar (ex: `123e4567-e89b-...`), pois você vai precisar dele no próximo passo!

---

## Passo 2: Criar o Cofre (A Conexão Web3)
Agora vamos atrelar uma carteira Solana (Cofre) ao seu usuário criado no passo anterior.

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/vaults`
* **Headers:** `Content-Type: application/json`
* **Body (Selecione "raw" e "JSON"):**
```json
{
  "user_id": "COLE_O_ID_DO_USUARIO_AQUI",
  "owner_pubkey": "A8Xy... (Sua Carteira Phantom)",
  "vault_pubkey": "V9Zt... (A Carteira do Cofre)",
  "key_reference": "aws-kms-key-123"
}
```
*(Nota: As pubkeys da Solana geralmente tem 44 caracteres, pode inventar um texto grande para testar)*
🎯 **O que você deve fazer:** Substitua o `user_id` pelo ID que você copiou no Passo 1. Aperte *Send*. Na resposta, **Copie o `id` do Cofre criado**.

---

## Passo 3: Criar um Agente de IA (Com Limites de Gasto)
Vamos criar uma IA e dar permissão para ela gastar dinheiro no Cofre criado. O detalhe aqui é que os limites estão em **Lamports** (1 SOL = 1.000.000.000 Lamports).

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/agents`
* **Headers:** `Content-Type: application/json`
* **Body (Selecione "raw" e "JSON"):**
```json
{
  "vault_id": "COLE_O_ID_DO_COFRE_AQUI",
  "name": "Agente de Marketing AIO",
  "role": "Pagar anúncios automaticamente no Twitter",
  "agent_pubkey": "Ag3nt... (Pubkey do Agente)",
  "daily_cap_lamports": 5000000000, 
  "single_tx_cap_lamports": 1000000000,
  "whitelist_enabled": false
}
```
*(Nota: O valor acima de 5000000000 equivale a 5 SOL por dia).*
🎯 **O que você deve fazer:** Substitua o `vault_id` pelo ID que você copiou no Passo 2. Aperte *Send*. Se retornar sucesso, a fundação do nosso motor de limites Web2 + Web3 está perfeita!

---
*Se qualquer passo retornar erro 500 ou mensagem de validação, avise imediatamente o Maestro no chat.*

## Passo 4: O Teste de Fogo (Gastar Solana!) 🔥
Este é o coração do projeto. Vamos simular o seu Agente pedindo para enviar 1 SOL (1 bilhão de Lamports) para uma carteira. 

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/transactions`
* **Headers:** `Content-Type: application/json`
* **Body (Selecione "raw" e "JSON"):**
```json
{
  "agent_id": "COLE_O_ID_DO_AGENTE_AQUI",
  "idempotency_key": "ID_UNICO_DA_REQ_1",
  "request_hash": "abc123hashFalso",
  "recipient_pubkey": "Destino... (Pubkey de quem vai receber)",
  "amount_lamports": 1000000000
}
```
*(Nota: O valor `1000000000` equivale a 1 SOL. A `idempotency_key` garante que se você clicar 2 vezes sem querer, ele não vai pagar duas vezes).*
🎯 **O que vai acontecer:**
1. O backend vai ver se esse valor não ultrapassa os `5000000000` (5 SOL) que você definiu de limite diário no Passo 3.
2. Se estiver dentro do limite, ele aprova.
3. Se a carteira de teste na Devnet ainda não tiver saldo ou faltar a chave secreta real no `.env`, ele vai estornar no banco com o status `FAILED` e te dar um aviso amigável de erro na rede!

---

## 🛡️ Passo 5: Validação Extrema de Segurança (The Firewall Test)

Para termos certeza que a API é à prova de balas, vamos tentar burlar o sistema.

### Teste A: Estourar o Limite Diário (A IA Ficou Louca)
Lembra que o Agente foi criado com limite de 5 SOL por dia? Você já gastou 0.5 SOL. Vamos tentar mandar **6 SOL** de uma vez para ver o nosso firewall Web2 barrando a IA antes de chegar na Blockchain!

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/transactions`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "agent_id": "COLE_O_MESMO_ID_DO_AGENTE",
  "idempotency_key": "REQ_TESTE_ESTOURO",
  "request_hash": "hash_de_teste",
  "recipient_pubkey": "7AXsoqzk6Lv8HToD8YugkUXyZctgHmymf6Afbc5bkEBH",
  "amount_lamports": 6000000000 
}
```
*(Nota: `6000000000` = 6 SOL)*
🎯 **Resultado Esperado:** Um belo erro `400 Bad Request` dizendo: `"Daily transaction cap exceeded"`. A transação não deve nem pisar na rede Solana, o dinheiro do dono fica protegido!

---

### Teste B: Buscar o Histórico de Transações
Vamos validar se a rota de leitura (`GET`) está puxando todas as transações que você tentou fazer.
*Aviso: Se o dev não tiver construído essa rota, avise o Maestro!*

* **Método:** `GET`
* **URL:** `http://localhost:3001/api/transactions?agent_id=COLE_AQUI_O_SEU_ID_DO_AGENTE`
* **Body:** Nenhum (Deixe em branco).
🎯 **Resultado Esperado:** Uma lista (`[ { ... } ]`) com todas as suas requisições, mostrando o histórico de `FAILED` e `CONFIRMED`.
