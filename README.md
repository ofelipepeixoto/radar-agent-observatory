# Radar Agent Observatory

Visualizador **autoral, experimental e somente leitura** para explorar recibos e relações declaradas. A aplicação atual usa **exclusivamente fixtures sintéticas locais**. Não comprova execução real, autorização atual, verdade da fonte, identidade, telemetria ao vivo ou produção.

O objetivo é oferecer um módulo pequeno que possa futuramente ser incorporado a um console existente. Este repositório público não inclui código, endereços, dados ou inventário de consoles privados. Nenhum console está integrado nesta versão.

## O que há

- Lista textual de registros e detalhe com até cinco referências por registro.
- Diagrama opcional e estático das mesmas relações; sem partículas, métricas inventadas ou confiança calculada artificialmente.
- Estados distintos: concluído no registro, abstenção, desconhecido e falha.
- Rótulos distintos para simulação explícita e histórico declarado; aviso de observação histórica desatualizada após cinco minutos.
- Contrato estrito, limite de 50 registros/128 KiB, timeout e rejeição de HTTP não-2xx.
- Conteúdo externo renderizado com `textContent`; sem `innerHTML`, chave de API ou persistência no navegador.

**Telemetria real permanece não conectada.** O contrato recusa `mode: "live"`; não há LLM, agente executor, MCP, n8n, streaming, aprovação ou ação externa. “Concluído” descreve a entrada, não comprova o evento. Um arquivo importado no futuro precisará de autenticação/proveniência no serviço; schema válido não autentica seu emissor.

## Executar localmente

Requer Node.js 22 ou posterior. Sem dependências npm e sem instalação de pacotes:

```sh
npm run check
npm test
npm start
```

Abra `http://127.0.0.1:8787`. Escolha um cenário e clique em **Carregar cenário**. Todas as entradas são fictícias, inclusive a opção de histórico. `private: true` no package.json bloqueia publicação acidental no npm; não define a visibilidade do GitHub.

O servidor local fornece somente arquivos allowlisted e GET, com CSP restritiva. Não é servidor autenticado de produção e não deve ser exposto à rede. Não há deployment configurado.

## Teste de navegador

Com Playwright Python e Chromium já disponíveis no ambiente:

```sh
npm run test:browser
```

O script usa `/usr/bin/chromium`; `CHROMIUM_PATH` pode indicar o binário local. Ele abre perfis descartáveis, bloqueia requests externos da página, usa fixtures e encerra seu servidor. Não roda um provedor. Capturas/resultados ficam em `artifacts/`, ignorado pelo Git. Usa `--no-sandbox` para o executor isolado de testes; isso não é orientação para produção.

Instalação de Playwright/Chromium não é feita pelos scripts. A CI inicialmente executa sintaxe e testes Node; o navegador foi validado separadamente no ambiente documentado em [VALIDATION](docs/VALIDATION.md).

## Integração futura

`src/contract.mjs` valida o envelope público independente descrito em [CONTRACT](docs/CONTRACT.md). `src/app.mjs` apresenta os dados, `src/load.mjs` hoje só permite três fixtures locais. Um adapter futuro deve projetar dados autorizados no backend para esse envelope, preservando tenant, redaction e significado histórico. Não basta trocar uma URL ou adicionar um campo “authorized”.

Não copiar tokens, prompts, texto integral de documentos ou logs privados para fixtures. O visualizador não decide permissões nem executa ferramentas. Começar com listagem limitada; streaming e grafos grandes dependem de necessidade e medição.

## Origem e limites

Implementação original de Carlos Felipe, MIT. A ideia de estudar visualização de etapas foi motivada por auditoria de ATSMATRIX; nenhum código, CSS, asset ou Content Hub upstream foi copiado. A marca ATSMATRIX não identifica este produto e não implica endosso. Veja [ORIGIN](docs/ORIGIN.md) e o [resumo público da auditoria](docs/AUDIT-PUBLIC.md).

Não há garantia de segurança, escalabilidade, conformidade WCAG ou adequação comercial. O estado atual é um experimento verificável para revisão, sem merge/deploy autorizados por sua mera existência.

## Demo estática sintética

`npm run build` produz `dist/` com apenas dez arquivos explicitamente permitidos. Assets e fixtures usam caminhos relativos; o mesmo artefato funciona em uma subpasta. `npm run test:static` verifica o build em `/nested/demo/`, incluindo erro sintético selecionável. Não copie a raiz do repositório para hospedagem. O build não contém servidor, credenciais, endpoint de console ou dados privados. Publicação e URL devem ser confirmadas pelo serviço de hospedagem; a existência de `dist` não comprova deploy.

O módulo `src/relations.mjs` e o contrato podem ser incorporados por consumidores com atribuição MIT, mantendo seu próprio backend autorizado. O diagrama só desenha relações recebidas e não autentica a fonte.
