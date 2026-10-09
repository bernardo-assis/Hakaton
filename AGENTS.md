# Memória do Time AIO Dev

## Lições Aprendidas (Aprendizado Contínuo)
- **Nova Lição (Delegação Obrigatória):** É ESTRITAMENTE PROIBIDO o agente principal (Maestro/Orquestrador) assumir os papéis e codificar por conta própria para "economizar tempo" ou "ajudar". O Orquestrador DEVE obrigatoriamente invocar subagentes especializados (ex: `@dev-back`, `@dev-front`) usando a ferramenta `invoke_subagent` para a execução real do código. O papel do Maestro é puramente coordenar, validar e guiar a passagem de bastão, respeitando a autonomia e as skills de cada agente.
