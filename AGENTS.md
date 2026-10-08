# Memória do projeto

As instruções de equipe fornecidas pelo usuário nesta sessão continuam aplicáveis. Este arquivo registra aprendizados locais; não substitui essas instruções.

## Regra de branches

- Fazer commits neste projeto somente na branch `bernardo`.
- Não mudar para `develop` ou `main`, nem integrar ou enviar alterações para essas branches, sem instrução explícita do usuário.
- Antes de cada commit, verificar que a branch ativa é `bernardo`.

## Lições Aprendidas

- 2026-10-08 — Revisão AgentSafe: antes de considerar uma modelagem de pagamentos completa, verificar representação inteira dos valores, idempotência, reserva atômica de orçamento/saldo, estados de confirmação e recuperação após reinício. Receber uma assinatura não comprova liquidação. Revisão: docs/architecture/DATABASE_REVIEW.md.
- 2026-10-08 — Implementação da modelagem: manter DDL executável em `backend/src/db/schema.sql` como fonte única e validar restrições em SQLite real. Não declarar orçamento concorrente, autenticação ou liquidação implementados apenas porque o schema aceita seus registros; essas garantias também exigem serviços e testes de integração.
