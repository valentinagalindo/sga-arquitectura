import fs from 'node:fs';
import path from 'node:path';

const mdPath = path.resolve('public/inventario-arquitectura-sga.md');
const outHtmlPath = path.resolve('public/informe-analisis-sga.html');

const rawMd = fs.readFileSync(mdPath, 'utf8');

// Replace the 754-line raw HTML dump in Parte 2.j with a crystal-clear architectural breakdown of the file for PDF readability
const startHtmlDump = rawMd.indexOf('## j) Código COMPLETO del Archivo HTML en un Solo Bloque (`prototipo-siga.html`)');
const endParte2 = rawMd.indexOf('FIN PARTE 2');

let processedMd = rawMd;
if (startHtmlDump !== -1 && endParte2 !== -1) {
  const clearCodeBreakdown = `## j) Análisis Estructural del Código Fuente (\`prototipo-siga.html\` — 754 líneas / 65.968 bytes)

> **Nota editorial para lectura en PDF:** Para preservar la claridad y legibilidad ejecutiva de este informe PDF sin insertar 20 páginas continuas de código HTML crudo, se presenta a continuación la **radiografía estructural verificable por rangos exactos de líneas** del archivo autónomo \`/public/prototipo-siga.html\`. El código fuente íntegro línea por línea está disponible en un clic en los botones **«Descargar HTML Único»** (\`prototipo-siga.html\`) y **«Descargar Inventario (.md)»** (\`inventario-arquitectura-sga.md\`).

| Rango de líneas | Bloque interno del archivo | Análisis de lo implementado realmente en código |
| :--- | :--- | :--- |
| **Líneas 1–80** | \`<head>\` y Hoja de Estilos CSS3 (\`:root\`, layout, tablas y \`@media print\`) | Define variables cromáticas de alto contraste WCAG 2.2 AA (\`#1E1B4B\` sobre \`#EEF2FF\`/\`#FFFFFF\`), tipografías \`Sora\` y \`Plus Jakarta Sans\`, indicador de foco visible de \`3px\` (\`:focus-visible\`) y ocultación de navegación al exportar reportes/certificados a PDF (\`@media print\`). |
| **Líneas 81–170** | Estructura DOM base (\`<header>\`, \`#session-bar\`, \`#screen-login\`, \`#screen-403\`, \`#app-viewport\`) | Separa físicamente la pantalla pública de autenticación (con casilla obligatoria Ley 1581 de 2012), la pantalla dedicada \`Acceso denegado (403)\` y el contenedor autenticado **sin ningún selector de cambio de rol**. |
| **Líneas 171–262** | Mapa RBAC (\`MENUS\`) y Base de Datos en Memoria (\`const db = { ... }\`) | Declara las rutas permitidas exclusivas para cada uno de los 4 roles y precarga en RAM 2 programas, 2 planes, 9 asignaturas con prerrequisitos, 6 cuentas ficticias, 2 periodos, 5 grupos diseñados para probar casos borde, 4 asignaturas aprobadas previas, 3 calificaciones, auditoría y notificaciones. |
| **Líneas 264–299** | Motor transversal: \`logAudit()\`, \`paginate()\`, \`canAccess()\` y \`navigate()\` | Centraliza la paginación (\`RF-11\`), verifica autorización RBAC en cada cambio de ruta y escribe automáticamente \`ACCESO_DENEGADO_403\` en \`db.auditoria\` cuando un rol intenta abrir un *hash* ajeno (\`RN-01\`). |
| **Líneas 307–520** | Renderizador reactivo por rol (\`render()\`) para las 10 vistas funcionales | Renderiza dinámicamente \`panel\`, \`admin-usuarios\`, \`admin-auditoria\`, \`coord-programas\`, \`coord-periodos\`, \`coord-reportes\`, \`docente-grupos\` (filtrando \`g.docenteId === u.id\`, \`RN-10\`), \`est-matricula\`, \`est-horario\` y \`est-notas\` (filtrando \`c.estado === 'publicada'\`, \`RN-11\`). |
| **Líneas 522–754** | Delegación de eventos (\`click\`, \`input\`, \`submit\`, \`hashchange\`), validaciones y exportadores | Ejecuta bloqueo al 5.º intento fallido (\`RN-02\`), validaciones compuestas de matrícula (\`RN-03..RN-08\`), publicación de notas y cálculo \`30/30/40\` (\`RN-11, RN-12\`), descarga CSV UTF-8 con BOM y \`window.print()\` para PDF (\`RF-18\`). |

`;
  processedMd = rawMd.slice(0, startHtmlDump) + clearCodeBreakdown + '\n' + rawMd.slice(endParte2);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(text) {
  let s = escapeHtml(text);
  // Line breaks <br> that were in markdown tables
  s = s.replace(/&lt;br\s*\/?&gt;/gi, '<br/>');
  // Math approximations used in text
  s = s.replace(/\$\\ge\s*([^$]+)\$/g, '&ge; $1');
  s = s.replace(/\$\\le\s*([^$]+)\$/g, '&le; $1');
  s = s.replace(/\$\\approx\s*([^$]+)\$/g, '&approx; $1');
  s = s.replace(/\$\\rightarrow\$/g, '&rarr;');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\$([0-9.,–\-+%a-zA-Z\s/]+)\$/g, '$1');

  const codeTokens = [];
  const pushCode = (htmlFrag) => {
    const idx = codeTokens.length;
    codeTokens.push(htmlFrag);
    return `\x00CODE_${idx}\x00`;
  };

  // Multi-backtick inline code spans first
  s = s.replace(/````([\s\S]*?)````/g, (_, code) => pushCode(`<code>${code.trim()}</code>`));
  s = s.replace(/```([^`]+)```/g, (_, code) => pushCode(`<code>${code.trim()}</code>`));
  s = s.replace(/``([^`]+)``/g, (_, code) => pushCode(`<code>${code.trim()}</code>`));

  // Single-backtick code spans
  s = s.replace(/`([^`]+)`/g, (_, code) => {
    const trimmed = code.trim();
    if (trimmed === 'NO EXISTE') return pushCode('<span class="badge badge-danger">NO EXISTE</span>');
    if (trimmed === 'NO VERIFICADO') return pushCode('<span class="badge badge-warn">NO VERIFICADO</span>');
    if (trimmed === 'VERIFICAR URL') return pushCode('<span class="badge badge-warn">VERIFICAR URL</span>');
    return pushCode(`<code>${code}</code>`);
  });

  // Bold (supports nested single *italic* inside **bold**) + Italic
  s = s.replace(/\*\*((?:[^*]|\*(?!\*))+)\*\*/g, (_, b) => {
    const t = b.trim();
    if (t === 'NO EXISTE' || t === 'NO EXISTEN') return `<span class="badge badge-danger">${b}</span>`;
    if (t === 'Implementado') return `<span class="badge badge-ok">${b}</span>`;
    if (t === 'Simulado') return `<span class="badge badge-sim">${b}</span>`;
    if (t === 'VERIFICAR URL') return `<span class="badge badge-warn">${b}</span>`;
    const withInnerEm = b.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return `<strong>${withInnerEm}</strong>`;
  });
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Restore code tokens
  s = s.replace(/\x00CODE_(\d+)\x00/g, (_, idx) => codeTokens[Number(idx)]);
  return s;
}

const PART_SUMMARIES = {
  'PARTE 1': {
    tag: 'Auditoría de Alcance Funcional y Atributos de Calidad',
    summary:
      'Evalúa uno a uno los 39 requisitos oficiales (20 funcionales RF-01..RF-20 y 19 no funcionales RNF-01..RNF-19). En la arquitectura: 35 requisitos están cubiertos íntegramente (89,7 %) y 4 presentan cobertura parcial con mejoras identificadas (RF-06 longitud de URL virtual, RF-10 vistas separadas de reportes vacíos, RNF-03 SPOF en PostgreSQL/Nginx frente al SLA de 99,5 % y RNF-17 flujo ARCO de supresión). En el prototipo HTML autónomo: 13 requisitos están Implementados en cliente, 11 Simulados en memoria RAM y 15 marcados honestamente como NO EXISTE por corresponder a infraestructura de servidor/BD.',
  },
  'PARTE 2': {
    tag: 'Inspección Técnica del Artefacto Ejecutable (prototipo-siga.html y SPA React)',
    summary:
      'Documenta qué hace realmente el prototipo entregado: almacenamiento 100 % volátil en RAM (se reinicia al pulsar F5), eliminación total del selector artificial de cambio de rol, menús exclusivos para los 4 roles con pantalla "Acceso denegado (403)" auditada, validaciones activas de formularios y las 7 limitaciones/incoherencias reales detectadas en auditoría de código (como estado de matrícula compartido en Est01 y uso de innerHTML sin escape en el archivo HTML autónomo).',
  },
  'PARTE 3': {
    tag: ' Diccionario Maestro de Arquitectura (Numeración Canónica Única)',
    summary:
      'Establece el vocabulario formal e invariable de todo el diseño: 4 Actores (ACT-01..04), 8 Módulos cohesivos (MOD-01..08), 20 Casos de Uso (CU-01..20), 12 Reglas de Negocio (RN-01..12), 15 Entidades relacionales (ENT-01..15) con 19 cardinalidades exactas, 25 endpoints REST (/api/v1/*) bajo OpenAPI 3.1 y 7 Decisiones Arquitectónicas (ADR-01..07) justificando por qué un Monolito Modular en 4 Capas Cerradas con DIP supera a Microservicios para este contexto universitario.',
  },
  'PARTE 4': {
    tag: 'Modelado Visual Verificable — Modelo 4+1 Vistas de Kruchten',
    summary:
      'Presenta los 5 diagramas arquitectónicos completos en sintaxis estándar PlantUML con correspondencia 1:1 frente a los catálogos de la Parte 3: (1) Casos de Uso — Vista +1, (2) Componentes en 4 Capas Cerradas e Inversión de Dependencias — Vista de Desarrollo, (3) Despliegue en Contenedores con DMZ y Subredes Privadas — Vista Física, (4) Modelo Conceptual de las 15 Entidades — Vista Lógica, y (5) Secuencias Transaccionales de Matrícula y Calificaciones — Vista de Procesos.',
  },
  'PARTE 5': {
    tag: 'Verificación Cruzada End-to-End y Evidencia Real de Pruebas',
    summary:
      'Conecta sin huérfanos los 39 requisitos con sus Casos de Uso, Reglas RN, ADRs, Módulos, Entidades, Endpoints y Métodos de Validación; especifica 15 casos concretos de prueba (CP-01..CP-15) para los requisitos críticos; y distingue con transparencia absoluta las pruebas realmente ejecutadas hoy (7/7 pruebas unitarias en node:test + compilación limpia + pruebas E2E en Chromium headless) de las pruebas de backend/carga no ejecutadas.',
  },
  'PARTE 6': {
    tag: 'Defensa en Profundidad, Continuidad Operativa (DRP) y Matriz de Riesgos',
    summary:
      'Detalla el aislamiento por subredes de los 7 nodos de despliegue, demuestra paso a paso cómo se cumple RPO <= 24 h (pg_dump diario + WAL cada 5 min cifrado AES-256) y RTO <= 4 h (restauración completa cronometrada en 2 h 40 min), traza milisegundo a milisegundo qué ocurre cuando dos estudiantes compiten por el último cupo (SELECT ... FOR UPDATE) y cataloga 10 riesgos técnicos (R-01..R-10), SPOFs y temas a validar con la institución.',
  },
  'PARTE 7': {
    tag: 'Transparencia Metodológica, Supuestos y Evolución del Diseño',
    summary:
      'Explicita los 5 supuestos paramétricos adoptados fuera del enunciado (escala 0.00–5.00, cortes 30/30/40, tope 18 créditos, bloqueo al 5.º intento, versiones LTS), señala qué métricas permanecen como NO VERIFICADO empíricamente por falta de backend Java desplegado, resume qué corrigió cada iteración del proyecto y entrega una lista de chequeo manual de 6 pasos.',
  },
  'PARTE 8': {
    tag: 'Fundamentación Técnica y Normativa Verificable',
    summary:
      'Reúne 8 fuentes primarias reales y de acceso abierto que respaldan las decisiones del diseño: Arquitectura en Capas, Modelo 4+1 de Kruchten (1995), REST de Fielding (2000), OpenAPI 3.1, guías de seguridad OWASP, Ley Estatutaria 1581 de 2012 de Colombia, estándar de accesibilidad W3C WCAG 2.2 AA y documentación oficial de respaldos/PITR en PostgreSQL 16.',
  },
};

function parseMarkdownToHtml(md) {
  const lines = md.split('\n');
  const html = [];
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    inTable = false;
    if (tableRows.length === 0) return;
    const headerCells = tableRows[0];
    const bodyRows = tableRows.slice(2); // skip alignment row
    html.push('<div class="table-container"><table><thead><tr>');
    for (const c of headerCells) {
      html.push(`<th>${formatInline(c)}</th>`);
    }
    html.push('</tr></thead><tbody>');
    for (const r of bodyRows) {
      html.push('<tr>');
      for (let idx = 0; idx < headerCells.length; idx++) {
        const cellVal = r[idx] ?? '';
        const classes = [];
        if (idx === 0 && cellVal.replace(/[*`]/g, '').trim().length <= 22) {
          classes.push('cell-id');
        }
        if (cellVal.trim() === 'Sí') classes.push('cell-yes');
        else if (cellVal.trim() === 'Parcial') classes.push('cell-partial');
        const clsAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
        html.push(`<td${clsAttr}>${formatInline(cellVal)}</td>`);
      }
      html.push('</tr>');
    }
    html.push('</tbody></table></div>');
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      closeLists();
      flushTable();
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim() || 'texto';
        codeLines = [];
      } else {
        inCode = false;
        html.push(
          `<div class="code-wrap"><div class="code-header">Código fuente / Especificación (${escapeHtml(
            codeLang.toUpperCase()
          )})</div><pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`
        );
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeLists();
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed === '---') {
      closeLists();
      continue;
    }

    if (/^FIN PARTE \d+$/.test(trimmed)) {
      closeLists();
      html.push(`<div class="fin-parte">${escapeHtml(trimmed)}</div>`);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      closeLists();
      const titleText = trimmed.slice(2).trim();
      if (titleText.startsWith('INVENTARIO TÉCNICO')) continue; // Rendered in custom cover
      const partKey = Object.keys(PART_SUMMARIES).find((k) => titleText.startsWith(k));
      const meta = partKey ? PART_SUMMARIES[partKey] : null;
      html.push(`<section class="part-break"><div class="part-banner">`);
      if (meta) {
        html.push(`<div class="part-kicker">${escapeHtml(meta.tag)}</div>`);
      }
      html.push(`<h1>${formatInline(titleText)}</h1>`);
      if (meta) {
        html.push(
          `<div class="part-exec-box"><strong>Síntesis analítica de esta parte:</strong> ${escapeHtml(
            meta.summary
          )}</div>`
        );
      }
      html.push(`</div></section>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      closeLists();
      html.push(`<h2>${formatInline(trimmed.slice(3).trim())}</h2>`);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      closeLists();
      html.push(`<h3>${formatInline(trimmed.slice(4).trim())}</h3>`);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      closeLists();
      html.push(`<blockquote class="callout">${formatInline(trimmed.slice(2).trim())}</blockquote>`);
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li value="${olMatch[1]}">${formatInline(olMatch[2])}</li>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[*+-]\s+(.*)$/);
    if (ulMatch) {
      const isIndented = /^ {2,}/.test(line);
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push(isIndented ? '<ul style="margin-left:32px;">' : '<ul>');
        inUl = true;
      }
      html.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${formatInline(trimmed)}</p>`);
  }

  closeLists();
  flushTable();
  return html.join('\n');
}

const bodyContent = parseMarkdownToHtml(processedMd);

const fullDocument = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Análisis Completo de Arquitectura y Auditoría (Partes 1 a 8) — SGA / SIGA</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 16mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1E1B4B;
      background: #FFFFFF;
      font-size: 9.2pt;
      line-height: 1.45;
    }
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #1E1B4B;
      color: #FFFFFF;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #4338CA;
    }
    .screen-toolbar a, .screen-toolbar button {
      background: #4338CA;
      color: #FFFFFF;
      text-decoration: none;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .screen-toolbar { display: none !important; }
    }
    .page-wrap {
      max-width: 980px;
      margin: 0 auto;
      padding: 8px 16px 32px 16px;
    }
    @media print {
      .page-wrap { max-width: none; padding: 0; }
    }

    /* Portada Ejecutiva */
    .cover-box {
      border: 2px solid #312E81;
      border-radius: 10px;
      padding: 20px 22px;
      background: #F5F7FF;
      margin-bottom: 16px;
      break-inside: avoid;
    }
    .cover-kicker {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #4338CA;
      margin-bottom: 6px;
    }
    .cover-title {
      font-size: 17pt;
      font-weight: 800;
      color: #1E1B4B;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .cover-sub {
      font-size: 9.5pt;
      color: #334155;
      margin-bottom: 14px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 12px;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #C7D2FE;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .kpi-num {
      font-size: 14pt;
      font-weight: 800;
      color: #4338CA;
    }
    .kpi-lbl {
      font-size: 7.8pt;
      color: #475569;
      margin-top: 2px;
    }
    .toc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 12px 0 18px 0;
      break-inside: avoid;
    }
    .toc-item {
      border: 1px solid #E0E7FF;
      background: #FFFFFF;
      border-left: 4px solid #4338CA;
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 8.3pt;
    }

    /* Secciones Parte 1..8 */
    .part-break {
      page-break-before: always;
      margin-top: 8px;
    }
    .part-banner {
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      border-left: 5px solid #4338CA;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      break-inside: avoid;
    }
    .part-kicker {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6D28D9;
      margin-bottom: 3px;
    }
    h1 {
      font-size: 13.5pt;
      font-weight: 800;
      color: #1E1B4B;
      margin-bottom: 6px;
    }
    .part-exec-box {
      font-size: 8.5pt;
      color: #1E293B;
      background: #FFFFFF;
      border: 1px solid #DBEAFE;
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 6px;
    }
    h2 {
      font-size: 10.8pt;
      font-weight: 700;
      color: #312E81;
      margin: 14px 0 6px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid #E0E7FF;
      break-after: avoid;
    }
    h3 {
      font-size: 9.6pt;
      font-weight: 700;
      color: #4338CA;
      margin: 10px 0 4px 0;
      break-after: avoid;
    }
    p { margin: 5px 0 7px 0; }
    ul, ol { margin: 5px 0 9px 18px; }
    li { margin-bottom: 3.5px; }

    .callout {
      background: #F8FAFC;
      border-left: 3px solid #2563EB;
      padding: 7px 10px;
      margin: 7px 0 10px 0;
      font-size: 8.4pt;
      color: #334155;
      border-radius: 0 6px 6px 0;
      break-inside: avoid;
    }

    /* Tablas optimizadas para impresión A4 */
    .table-container {
      margin: 8px 0 12px 0;
      width: 100%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.7pt;
      line-height: 1.35;
      table-layout: auto;
    }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 4.5px 6px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      background: #1E1B4B;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 7.6pt;
    }
    tbody tr:nth-child(even) { background: #F8FAFC; }
    .cell-id { white-space: nowrap; overflow-wrap: normal; }
    .cell-yes { font-weight: 700; color: #065F46; background: #ECFDF5 !important; text-align: center; white-space: nowrap; overflow-wrap: normal; }
    .cell-partial { font-weight: 700; color: #92400E; background: #FEF3C7 !important; text-align: center; white-space: nowrap; overflow-wrap: normal; }

    /* Etiquetas semánticas */
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.4pt;
      background: #EEF2FF;
      color: #312E81;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 7.2pt;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-ok { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
    .badge-sim { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
    .badge-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
    .badge-warn { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }

    /* Bloques PlantUML / Código */
    .code-wrap {
      margin: 8px 0 12px 0;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
      break-inside: auto;
    }
    .code-header {
      background: #1E1B4B;
      color: #E0E7FF;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 4px 10px;
    }
    pre {
      background: #F8FAFC;
      padding: 8px 10px;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.1pt;
      line-height: 1.32;
      color: #0F172A;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    .fin-parte {
      margin: 10px 0 4px 0;
      padding: 4px 10px;
      background: #F1F5F9;
      border: 1px dashed #94A3B8;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div><strong>SIGA · Informe Técnico Auditado (Partes 1 a 8)</strong></div>
    <div style="display:flex; gap:8px;">
      <a href="/analisis-arquitectura-sga.pdf" download="analisis-arquitectura-sga.pdf">Descargar PDF Directo</a>
      <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
  </div>

  <div class="page-wrap">
    <section class="cover-box">
      <div class="cover-kicker">Auditoría de Arquitectura de Software · Modelo 4+1 de Kruchten · Capas Cerradas</div>
      <div class="cover-title">Análisis Integral e Inventario Verificable (Partes 1 a 8)<br/>Sistema de Gestión Académica Universitaria (SGA / SIGA)</div>
      <div class="cover-sub">
        Documento maestro de análisis arquitectónico, trazabilidad de los 39 requisitos oficiales (RF-01..RF-20 y RNF-01..RNF-19), auditoría honesta del prototipo funcional, catálogos unificados, diagramas PlantUML, pruebas, seguridad, continuidad operativa (RPO/RTO) y fuentes normativas.
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-num">39 / 39</div>
          <div class="kpi-lbl">Requisitos auditados (35 cubiertos al 100 % en arquitectura; 4 parciales explicados)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-num">4 Capas + DIP</div>
          <div class="kpi-lbl">Presentación (React/Nginx) &rarr; API (Spring Boot) &rarr; Dominio Puro &larr; JPA/PostgreSQL</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-num">15 Entidades</div>
          <div class="kpi-lbl">8 módulos, 20 casos de uso (CU-01..20), 12 reglas (RN-01..12) y 25 rutas REST</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-num">7 / 7 Pass</div>
          <div class="kpi-lbl">Pruebas unitarias ejecutadas en dominio TS + validación E2E RBAC 403 en navegador</div>
        </div>
      </div>
    </section>

    <h2>Mapa Ejecutivo de las 8 Partes del Documento</h2>
    <div class="toc-grid">
      <div class="toc-item"><strong>PARTE 1 · Cobertura de Requisitos:</strong> Matriz completa RF-01..20 y RNF-01..19 (arquitectura vs. prototipo) y análisis de las 4 debilidades detectadas.</div>
      <div class="toc-item"><strong>PARTE 2 · Ficha y Auditoría del Prototipo:</strong> Almacenamiento en RAM, cuentas de prueba, pantallas por rol, matriz CRUD, validaciones y limitaciones reales.</div>
      <div class="toc-item"><strong>PARTE 3 · Catálogos con ID Único:</strong> Actores, módulos, CU-01..20, reglas RN-01..12, 15 entidades SQL, cardinalidades, API REST y ADR-01..07.</div>
      <div class="toc-item"><strong>PARTE 4 · Diagramas PlantUML (4+1):</strong> Casos de uso, componentes en capas cerradas, despliegue Docker, datos conceptuales y secuencias ACID.</div>
      <div class="toc-item"><strong>PARTE 5 · Trazabilidad y Pruebas:</strong> Matriz cruzada de 39 filas, 15 casos críticos (CP-01..15) y separación honesta entre pruebas ejecutadas y no ejecutadas.</div>
      <div class="toc-item"><strong>PARTE 6 · Seguridad, DRP y Riesgos:</strong> 7 nodos, plan paso a paso RPO &le; 24 h / RTO &le; 4 h, concurrencia en último cupo y 10 riesgos (R-01..10).</div>
      <div class="toc-item"><strong>PARTE 7 · Autoevaluación Crítica:</strong> Supuestos adoptados, puntos NO VERIFICADOS, evolución entre entregas y lista de chequeo manual.</div>
      <div class="toc-item"><strong>PARTE 8 · Fuentes de Acceso Libre:</strong> 8 referencias primarias verificables (Kruchten, Fielding, OpenAPI, OWASP, Ley 1581/2012, WCAG 2.2, PostgreSQL).</div>
    </div>

    <h3>Conclusiones Ejecutivas Clave del Análisis</h3>
    <ul>
      <li><strong>Coherencia del estilo arquitectónico (ADR-01):</strong> Para una carga objetivo de <strong>300 usuarios concurrentes en &le; 3 s (RNF-02)</strong> y alta consistencia en cupos/prerrequisitos (<strong>RNF-07</strong>), el <strong>monolito modular en 4 capas cerradas con inversión de dependencias</strong> evita la complejidad y consistencia eventual de microservicios sin caer en el acoplamiento de un monolito sin capas.</li>
      <li><strong>Seguridad y Privacidad por Rol (RN-01, RN-10, RN-11):</strong> El rol depende estrictamente de la cuenta autenticada (sin conmutador de rol); todo intento sobre rutas ajenas o grupos de otro docente dispara <code>Acceso denegado (403)</code> y deja evidencia inmutable en <code>EventoAuditoría</code>; el estudiante jamás ve notas en estado <code>borrador</code>.</li>
      <li><strong>Principales brechas a subsanar antes de producción:</strong> (1) Eliminar el Punto Único de Falla (SPOF) de <code>PostgreSQL</code> y <code>Nginx</code> añadiendo réplica <em>standby</em> automática para blindar el <code>99,5 %</code> de disponibilidad mensual (<code>RNF-03</code>); (2) ampliar <code>Horario.aula</code> de <code>VARCHAR(60)</code> a <code>VARCHAR(255)</code> para enlaces virtuales largos (<code>RF-06</code>); y (3) implementar reportes separados para grupos con cero inscritos (<code>RF-10</code>).</li>
    </ul>

    ${bodyContent}
  </div>
</body>
</html>`;

fs.writeFileSync(outHtmlPath, fullDocument, 'utf8');
console.log('Generated HTML report:', outHtmlPath, fs.statSync(outHtmlPath).size, 'bytes');
