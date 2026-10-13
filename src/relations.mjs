// Copyright (c) 2026 Carlos Felipe. SPDX-License-Identifier: MIT
function svgNode(tag, attributes, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}
export function createRelationDiagram(evidence) {
  const height = Math.max(100, evidence.length * 70);
  const svg = svgNode('svg', {viewBox:`0 0 520 ${height}`, role:'img', 'aria-label':'Relações declaradas do registro para suas referências; mesma informação da lista textual'});
  svg.append(svgNode('rect', {x:5,y:height/2-22,width:155,height:44,rx:8}));
  svg.append(svgNode('text', {x:15,y:height/2+5}, 'Registro selecionado'));
  evidence.forEach((e, i) => {
    const y = i*70+35;
    svg.append(svgNode('line', {x1:160,y1:height/2,x2:265,y2:y}));
    svg.append(svgNode('rect', {x:265,y:y-22,width:250,height:44,rx:8}));
    svg.append(svgNode('text', {x:275,y:y+5}, `Referência ${i+1} · p. ${e.page} · rev. ${e.revision}`));
  });
  return svg;
}
