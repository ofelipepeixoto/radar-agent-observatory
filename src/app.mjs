// Copyright (c) 2026 Carlos Felipe. SPDX-License-Identifier: MIT
import {loadSnapshot} from './load.mjs';
import {freshness} from './contract.mjs';
const $ = id => document.getElementById(id);
const labels = {completed:'Concluído no registro', abstained:'Abstenção registrada', unknown:'Resultado desconhecido', failed:'Falha registrada'};
let current = null;
function node(tag, content) { const el = document.createElement(tag); el.textContent = content; return el; }
function svgNode(tag, attributes, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}
function showDetail(record) {
  $('summary').textContent = record.summary;
  $('evidence').replaceChildren(); $('graph').replaceChildren();
  for (const e of record.evidence) $('evidence').append(node('li', `${e.document} · página ${e.page} · revisão ${e.revision} · ${e.id}`));
  if (!record.evidence.length) $('evidence').append(node('li', 'Sem referências declaradas.'));
  $('relations').hidden = record.evidence.length === 0;
  const height = Math.max(100, record.evidence.length * 70);
  const svg = svgNode('svg', {viewBox:`0 0 520 ${height}`, role:'img', 'aria-label':'Relações declaradas do registro para suas referências; mesma informação da lista textual'});
  svg.append(svgNode('rect', {x:5,y:height/2-22,width:155,height:44,rx:8}));
  svg.append(svgNode('text', {x:15,y:height/2+5}, 'Registro selecionado'));
  record.evidence.forEach((e, i) => {
    const y = i*70+35;
    svg.append(svgNode('line', {x1:160,y1:height/2,x2:265,y2:y}));
    svg.append(svgNode('rect', {x:265,y:y-22,width:250,height:44,rx:8}));
    svg.append(svgNode('text', {x:275,y:y+5}, `Referência ${i+1} · p. ${e.page} · rev. ${e.revision}`));
  });
  $('graph').append(svg);
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
    li.append(button, node('small', record.recordedAt)); $('records').append(li);
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
