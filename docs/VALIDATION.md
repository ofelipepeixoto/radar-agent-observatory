# Validação local — 13/10/2026

TEST VERIFIED: Node 24.19.0, Python 3.12.14, Playwright com Chromium 151.0.7922.173 headless, Linux, servidor loopback. Somente dados sintéticos; requisições externas da página bloqueadas. Nenhum provedor, chave ou console real utilizado.

- `npm run check`: exit 0, sintaxe dos quatro módulos.
- `npm test`: exit 0, 29 testes aprovados, zero falhas (contrato, limites, HTTP, timeout e servidor).
- `npm run test:browser`: exit 0, 13 verificações aprovadas; zero pageErrors e zero requests externos. Inclui três superfícies DOM com markup hostil literal, HTTP 401/429/500, retry, contrato inválido, vazio, histórico desatualizado, relações opcionais, teclado e viewport de 390 px.
- Capturas desktop/mobile inspecionadas localmente; resultados reproduzíveis em `artifacts/`.

Duas falhas iniciais pertenciam ao harness: expressão de espera bloqueada pela CSP e callback de rota cujo argumento opcional recebia Request. Corrigidos com locator assertion e assinatura explícita. A CSP permaneceu restritiva. O ensaio final passou.

NOT VERIFIED: backend/autorização reais, LLM, leitores de tela, conformidade WCAG completa, outros navegadores, carga concorrente, escala de produção. Node 22 está previsto na CI; não foi executado localmente. A presença do workflow não prova CI verde. Nenhum deploy ou merge realizado por estes testes.
