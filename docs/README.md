# Documentação do AgentSafe

Revisão de 12/10/2026 baseada em `origin/main` no commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`. Site informado pelo responsável: https://agentsafe.kernellabs.uk/. O código revisado e a versão instalada na VPS precisam ser vinculados por evidência de publicação; acesso público sozinho não comprova igualdade entre eles.

## Para usar e testar

**Para a banca internacional: [JUDGES_GUIDE.md](JUDGES_GUIDE.md)** reúne explicação, preparação, roteiro completo, resultados esperados, problemas comuns e registro de aceite em um único documento em inglês.

| Documento | Quando abrir |
|---|---|
| [Guia completo do usuário](USER_GUIDE_PT.md) | Entender endereços, telas, campos, botões e erros, passo a passo |
| [Roteiro da aplicação publicada](PUBLISHED_APP_MANUAL_TEST_PT.md) | Fazer a primeira demonstração no site e registrar o resultado real |
| [Teste das telas](UI_MANUAL_TEST.md) | Conferir estados vazios, filtros, políticas, persistência e apresentação |
| [Teste de pagamentos](PAYMENT_PANEL_MANUAL_TEST.md) | Validar fila, aprovação, limites, confirmação e recuperação |
| [Teste de login por carteira](WALLET_AUTH_MANUAL_TEST.md) | Conferir assinatura, troca de conta e privacidade |
| [Teste técnico de backend](manual-test-guide-backend.md) | Usar Postman com os contratos atuais, sem as rotas antigas |

## Para desenvolver e operar

| Documento | Conteúdo |
|---|---|
| [Revisão atual da main e VPS](MAIN_VPS_REVIEW_2026-10-12.md) | Resultados de QA, achados, prioridades e limites do aceite publicado |
| [Operação da VPS](VPS_RUNBOOK.md) | Inspeção, identificação da release, backup/restauração e saúde |
| [Arquitetura atual](architecture/ARCHITECTURE.md) | Componentes, fluxo de dados e limites do sistema |
| [Instalação e publicação](DEPLOYMENT.md) | Demo local, Docker, configuração, segredos e verificações do serviço |
| [API REST](api/REST_API.md) | Endpoints, cookies, credenciais, formatos e respostas |
| [Arquitetura de segurança](architecture/SECURITY_ARCHITECTURE.md) | Responsabilidade pelas chaves e proteção dos pagamentos |
| [Contrato de pagamentos Devnet](architecture/DEVNET_PAYMENT_PLAN.md) | Solicitação, aprovação, reserva e confirmação |
| [Relatório de ataques](security/SECURITY_ATTACK_REPORT.md) | Casos adversariais e limitações conhecidas |
| [Evidência de QA de pagamentos](PAYMENT_QA.md) | Testes automatizados/históricos e o que eles comprovam |
| [PRD](prd.md) | Escopo e requisitos de concepção |

Leia documentos de concepção e stories antigas como histórico. Eles não substituem os contratos do código atual. Um checklist marcado e uma captura de tela não comprovam uma transferência finalizada. Registre separadamente implementação, teste local, teste no site e evidência na rede.
