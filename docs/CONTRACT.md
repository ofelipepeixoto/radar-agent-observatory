# Contrato de entrada v1

Envelope JSON UTF-8 com exatamente `schemaVersion`, `mode`, `observedAt`, `sourceLabel`, `records`.

- `schemaVersion`: número inteiro 1.
- `mode`: `synthetic` ou `historical`. `live` é recusado; não há transporte de telemetria real.
- `observedAt`: UTC ISO canônico com milissegundos (`2026-10-13T12:00:00.000Z`), data existente e no máximo 60 segundos no futuro do relógio local.
- `sourceLabel`: texto não vazio de até 160 code units, sem controles ASCII. É uma alegação do emissor, não prova de origem.
- `records`: até 50 registros com IDs únicos. Lista vazia é válida.

Cada registro tem exatamente `id` (até 80), `status` (`completed`, `abstained`, `unknown`, `failed`), `recordedAt` (não posterior a observedAt), `summary` (até 400) e `evidence` (até 5).

Cada referência tem exatamente `id` (até 80, único dentro do registro), `document` (até 160), `page` e `revision` (inteiros seguros positivos; booleanos recusados). Strings são preservadas como dados e renderizadas literalmente, não interpretadas como HTML, URL ou comando. Não há hyperlinks vindos da entrada.

Campos extras, inclusive afirmações de autorização, prompts e segredos, são recusados. Schema não substitui sanitização/redaction no produtor. O limite global do transporte é 128 KiB, inclusive quando Content-Length está ausente. Não há persistência.

Histórico com observação mais antiga que 5 minutos recebe `stale`. Observação recente continua histórica: o cliente não autentica origem, resultado ou autorização. O relógio local pode estar errado; o rótulo não é SLA. Simulação tem rótulo próprio e nunca recebe aparência de frescor real.

O loader usa fontes fixas, GET, credentials omit, redirects negados, timeout total de 5 segundos e validação após status HTTP e Content-Type. Falha oculta a visualização anterior, exibe código sanitizado e permite retry manual. Nenhuma operação de execução é repetida porque nenhuma existe.

Um adapter futuro exige revisão própria de autenticação, tenant e provenance. Este contrato é independente, sem importação de implementações ou dados privados do ecossistema.
