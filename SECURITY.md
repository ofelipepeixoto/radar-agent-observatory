# Segurança e escopo

Experimento com fixtures sintéticas e servidor em loopback. Não usar para guardar chaves, autenticar pessoas, aprovar ações ou expor dados privados. Nenhum provider/console real está conectado.

Entrada é não confiável: status HTTP, MIME, tamanho, tempo e schema são verificados. DOM usa textContent e SVG criado por API; sem HTML dinâmico e sem URLs provenientes da entrada. Servidor local possui allowlist de arquivos, GET-only e CSP. Esses controles não certificam segurança global nem isolamento multitenant.

Relatos devem usar dados sintéticos e descrever impacto/reprodução sem publicar segredos. Não testar terceiros ou produção para demonstrar um problema deste laboratório. Integração futura exige autenticação/autorização no backend, redaction, observabilidade e revisão própria.
