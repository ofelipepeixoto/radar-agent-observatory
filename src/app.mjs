import {createRelationDiagram} from './relations.mjs';
// Copyright (c) 2026 Carlos Felipe. SPDX-License-Identifier: MIT
import {loadSnapshot} from './load.mjs';
import {freshness} from './contract.mjs';
const $ = id => document.getElementById(id);
const labels = {completed:'Concluído no registro', abstained:'Abstenção registrada', unknown:'Resultado desconhecido', failed:'Falha registrada'};
let current = null;
function node(tag, content) { const el = document.createElement(tag); el.textContent = content; return el; }
function showDetail(record) {
  $('summary').textContent = record.summary;
  $('evidence').replaceChildren(); $('graph').replaceChildren();
  for (const e of record.evidence) $('evidence').append(node('li', `${e.document} · página ${e.page} · revisão ${e.revision} · ${e.id}`));
  if (!record.evidence.length) $('evidence').append(node('li', 'Sem referências declaradas.'));
  $('relations').hidden = record.evidence.length === 0;
  $('graph').append(createRelationDiagram(record.evidence));
}
function updateFreshness() {
  if (!current) return;
  const value = freshness(current);
  $('freshness').textContent = value === 'synthetic' ? 'Simulação: sem medida de frescor real' : value === 'stale' ? 'Desatualizado: observação com mais de 5 minutos' : 'Observação recente: continua sendo histórico';
  $('freshness').dataset.state = value;
}
function render(snapshot) {
  current = snapshot;
  $('mode').textContent = snapshot.mode === 'synthetic' ? 'SIMULAÇÃO EXPLÍCITA' : 'HISTÓRICO DECLARADO';
  $('observed').textContent = `Observado em: ${snapshot.observedAt}`;
  $('origin').textContent = `Origem declarada: ${snapshot.sourceLabel}`;
  updateFreshness();
  $('records').replaceChildren(); $('evidence').replaceChildren(); $('graph').replaceChildren();
  $('relations').open = false; $('relations').hidden = true;
  $('empty').hidden = snapshot.records.length !== 0;
  $('detail').hidden = snapshot.records.length === 0;
  for (const record of snapshot.records) {
    const li = document.createElement('li'); const button = node('button', `${labels[record.status]} · ${record.id}`);
    button.type = 'button'; button.addEventListener('click', () => showDetail(record));
    li.append(button, node('small', record.recordedAt ?? 'Horário não informado no registro')); $('records').append(li);
  }
  if (snapshot.records.length) showDetail(snapshot.records[0]);
  $('snapshot').hidden = false;
}
$('load').addEventListener('click', async () => {
  $('load').disabled = true; $('source').disabled = true; $('snapshot').hidden = true;
  current = null; $('error').hidden = true; $('state').textContent = 'Carregando e validando o cenário…';
  try {
    const result = await loadSnapshot($('source').value);
    render(result); $('state').textContent = `${result.records.length} registro(s) carregado(s). Nenhuma execução iniciada.`;
  } catch (error) {
    const code = /^(HTTP_\d{3}|TIMEOUT|BODY_TOO_LARGE|INVALID_CONTRACT|INVALID_JSON|INVALID_CONTENT_TYPE|EMPTY_BODY|REDIRECT_DENIED)$/.test(error.message) ? error.message : 'LOAD_FAILED';
    $('state').textContent = 'Dados indisponíveis.';
    $('error').textContent = `Não foi possível carregar uma entrada válida (${code}). Nenhum sucesso foi presumido. Tente carregar novamente.`;
    $('error').hidden = false;
  } finally { $('load').disabled = false; $('source').disabled = false; }
});
setInterval(updateFreshness, 30_000);
