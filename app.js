const starters = {
  greeter: `// Start with a Joebject. Then send it a message.
joebject Greeter {
  has name = "Joe Team"

  does welcome() {
    show "Welcome, " + name + "!"
  }
}

newjoe Greeter as guide
guide.welcome()`,
  lantern: `// State belongs to the Joebject that changes it.
joebject Lantern {
  has charge = 3
  has lit = falsejoe

  does light() {
    when charge > 0 {
      lit = truejoe
      charge = charge - 1
      show "The lantern glows."
    } otherwise {
      show "No charge remains."
    }
    give charge
  }
}

newjoe Lantern as field_lantern
show field_lantern.light()`,
  fieldlog: `// Lists are useful for observations, tasks, and records.
joebject FieldLog {
  has entries = ["Signal received", "Projection verified"]

  does review() {
    each entry in entries {
      show "- " + entry
    }
    give entries
  }
}

newjoe FieldLog as log
log.review()`,
  scoreboard: `joebject Scoreboard {
  has score = 0

  does add(points) {
    score = score + points
    show "Score is now " + score
    give score
  }
}

newjoe Scoreboard as board
show board.add(10)`
};

const sourceEditor = document.querySelector('#source-editor');
const lineNumbers = document.querySelector('#line-numbers');
const projectionOutput = document.querySelector('#projection-output');
const consoleOutput = document.querySelector('#console-output');
const inspectorOutput = document.querySelector('#inspector-output');
const sourceStat = document.querySelector('#source-stat');
const projectionStat = document.querySelector('#projection-stat');
const runStatus = document.querySelector('#run-status');
const starterSelect = document.querySelector('#starter-select');

function updateLineNumbers() {
  const count = sourceEditor.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: count }, (_, index) => `<span>${index + 1}</span>`).join('');
  sourceStat.textContent = `${count} ${count === 1 ? 'line' : 'lines'} · ${sourceEditor.value.length} chars`;
}

function setStatus(message, state = 'ready') {
  runStatus.dataset.state = state;
  runStatus.querySelector('span:last-child').textContent = message;
}

function clearConsole() {
  consoleOutput.innerHTML = '<p class="console-hint">Console cleared. Run the source to continue.</p>';
}

function pushConsole(message, isError = false) {
  const hint = consoleOutput.querySelector('.console-hint');
  if (hint) hint.remove();
  const line = document.createElement('p');
  line.className = `console-line${isError ? ' console-error' : ''}`;
  line.textContent = message;
  consoleOutput.append(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function stripComments(source) {
  return source.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n');
}

function matchingBrace(text, openIndex) {
  let depth = 0;
  let inString = false;
  let quote = '';
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if ((char === '"' || char === "'") && text[index - 1] !== '\\') {
      if (!inString) { inString = true; quote = char; }
      else if (quote === char) inString = false;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    if (char === '}') { depth -= 1; if (depth === 0) return index; }
  }
  return -1;
}

function splitTopLevel(text, separator = ',') {
  const parts = [];
  let start = 0, depth = 0, quote = '';
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if ((c === '"' || c === "'") && text[i - 1] !== '\\') quote = quote === c ? '' : (quote || c);
    if (quote) continue;
    if ('([{'.includes(c)) depth += 1;
    if (')]}'.includes(c)) depth -= 1;
    if (c === separator && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  const last = text.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

function parseJoe(source) {
  const clean = stripComments(source);
  const types = {};
  const ranges = [];
  const declaration = /\bjoebject\s+([A-Za-z][\w]*)\s*\{/g;
  let found;
  while ((found = declaration.exec(clean))) {
    const bodyStart = declaration.lastIndex - 1;
    const bodyEnd = matchingBrace(clean, bodyStart);
    if (bodyEnd === -1) throw new Error(`Expected a closing brace for Joebject ${found[1]}.`);
    const name = found[1];
    if (types[name]) throw new Error(`Joebject ${name} is declared more than once.`);
    const body = clean.slice(bodyStart + 1, bodyEnd);
    const states = {};
    const statePattern = /\bhas\s+([A-Za-z][\w]*)\s*=\s*([^\n;]+)/g;
    let stateMatch;
    while ((stateMatch = statePattern.exec(body))) states[stateMatch[1]] = stateMatch[2].trim();
    const methods = {};
    const methodPattern = /\bdoes\s+([A-Za-z][\w]*)\s*\(([^)]*)\)\s*\{/g;
    let methodMatch;
    while ((methodMatch = methodPattern.exec(body))) {
      const methodStart = methodPattern.lastIndex - 1;
      const methodEnd = matchingBrace(body, methodStart);
      if (methodEnd === -1) throw new Error(`Expected a closing brace for behavior ${methodMatch[1]}.`);
      methods[methodMatch[1]] = { params: splitTopLevel(methodMatch[2]).filter(Boolean), body: body.slice(methodStart + 1, methodEnd) };
    }
    types[name] = { name, states, methods };
    ranges.push([found.index, bodyEnd + 1]);
    declaration.lastIndex = bodyEnd + 1;
  }
  if (Object.keys(types).length === 0) throw new Error('Start with a Joebject declaration, such as: joebject Greeter { ... }.');
  let topLevel = clean;
  [...ranges].reverse().forEach(([start, end]) => { topLevel = topLevel.slice(0, start) + ' '.repeat(end - start) + topLevel.slice(end); });
  return { types, topLevel };
}

function expressionToJs(expression) {
  let result = expression.trim();
  result = result.replace(/\btruejoe\b/g, 'true').replace(/\bfalsejoe\b/g, 'false').replace(/\bnonejoe\b/g, 'null');
  return result;
}

function projectMethodLine(line, stateNames) {
  const trimmed = line.trim();
  const projectExpression = value => {
    let output = expressionToJs(value);
    const pieces = output.split(/((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))/);
    return pieces.map((piece, index) => {
      if (index % 2 === 1) return piece;
      let projected = piece;
      stateNames.forEach(name => { projected = projected.replace(new RegExp(`\\b${name}\\b`, 'g'), `this.${name}`); });
      return projected;
    }).join('');
  };
  if (!trimmed) return '';
  if (trimmed.startsWith('when ')) return `if (${projectExpression(trimmed.slice(5, -1).trim())}) {`;
  if (trimmed.startsWith('} otherwise')) return '} else {';
  if (trimmed === 'otherwise {') return 'else {';
  if (trimmed.startsWith('each ')) {
    const match = trimmed.match(/^each\s+(\w+)\s+in\s+(.+)\s*\{$/);
    return match ? `for (const ${match[1]} of ${projectExpression(match[2])}) {` : `// ${trimmed}`;
  }
  if (trimmed.startsWith('show ')) return `console.log(${projectExpression(trimmed.slice(5))});`;
  if (trimmed.startsWith('give ')) return `return ${projectExpression(trimmed.slice(5))};`;
  const update = trimmed.match(/^([A-Za-z][\w]*)\s*=\s*(.+)$/);
  if (update && stateNames.includes(update[1])) return `this.${update[1]} = ${projectExpression(update[2])};`;
  return projectExpression(trimmed);
}

function renderProjection(program) {
  const lines = ['// Generated by the JoeLang Projection Engine v0.9', ''];
  Object.values(program.types).forEach(type => {
    lines.push(`class ${type.name} {`);
    lines.push('  constructor() {');
    Object.entries(type.states).forEach(([key, value]) => lines.push(`    this.${key} = ${expressionToJs(value)};`));
    lines.push('  }');
    Object.entries(type.methods).forEach(([name, method]) => {
      lines.push(`  ${name}(${method.params.join(', ')}) {`);
      const stateNames = Object.keys(type.states);
      lines.push(...method.body.trim().split('\n').filter(Boolean).map(line => `    ${projectMethodLine(line, stateNames)}`));
      lines.push('  }');
    });
    lines.push('}', '');
  });
  const topLines = program.topLevel.split('\n').map(line => line.trim()).filter(Boolean);
  topLines.forEach(line => {
    const create = line.match(/^newjoe\s+(\w+)\s+as\s+(\w+)$/);
    if (create) lines.push(`const ${create[2]} = new ${create[1]}();`);
    else lines.push(expressionToJs(line.replace(/^show\s+/, 'console.log(')) + (line.startsWith('show ') ? ')' : ''));
  });
  projectionOutput.textContent = lines.join('\n');
  projectionStat.textContent = `${Object.keys(program.types).length} Joebject${Object.keys(program.types).length === 1 ? '' : 's'} projected`;
}

function evaluateExpression(expression, scope) {
  const text = expression.trim();
  if (!text) return undefined;
  if (text === 'truejoe') return true;
  if (text === 'falsejoe') return false;
  if (text === 'nonejoe') return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  const comparison = text.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (comparison) {
    const left = evaluateExpression(comparison[1], scope), right = evaluateExpression(comparison[3], scope);
    return ({ '==': left === right, '!=': left !== right, '>': left > right, '<': left < right, '>=': left >= right, '<=': left <= right })[comparison[2]];
  }
  const plus = splitTopLevel(text, '+');
  if (plus.length > 1) return plus.map(part => evaluateExpression(part, scope)).reduce((a, b) => a + b);
  const minus = text.match(/^(.+?)\s+-\s+(.+)$/);
  if (minus) return Number(evaluateExpression(minus[1], scope)) - Number(evaluateExpression(minus[2], scope));
  if (text.startsWith('not ')) return !evaluateExpression(text.slice(4), scope);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) return text.slice(1, -1);
  if (text.startsWith('[') && text.endsWith(']')) return splitTopLevel(text.slice(1, -1)).map(item => evaluateExpression(item, scope));
  if (Object.prototype.hasOwnProperty.call(scope, text)) return scope[text];
  return text;
}

function statementsFrom(body) {
  const output = [];
  let index = 0;
  while (index < body.length) {
    while (/\s|;/.test(body[index] || '')) index += 1;
    if (index >= body.length) break;
    if (body.startsWith('when ', index)) {
      const brace = body.indexOf('{', index);
      if (brace === -1) throw new Error('A when statement needs an opening brace.');
      const end = matchingBrace(body, brace);
      if (end === -1) throw new Error('A when statement needs a closing brace.');
      const condition = body.slice(index + 5, brace).trim();
      let cursor = end + 1;
      while (/\s/.test(body[cursor] || '')) cursor += 1;
      let otherwise = '';
      if (body.startsWith('otherwise', cursor)) {
        const otherBrace = body.indexOf('{', cursor);
        const otherEnd = matchingBrace(body, otherBrace);
        if (otherBrace === -1 || otherEnd === -1) throw new Error('Otherwise needs a complete brace block.');
        otherwise = body.slice(otherBrace + 1, otherEnd); cursor = otherEnd + 1;
      }
      output.push({ kind: 'when', condition, yes: body.slice(brace + 1, end), no: otherwise }); index = cursor; continue;
    }
    if (body.startsWith('each ', index)) {
      const brace = body.indexOf('{', index); const end = matchingBrace(body, brace);
      const header = body.slice(index + 5, brace).trim().match(/^(\w+)\s+in\s+(.+)$/);
      if (!header || end === -1) throw new Error('Use each item in collection { ... }.');
      output.push({ kind: 'each', item: header[1], collection: header[2], body: body.slice(brace + 1, end) }); index = end + 1; continue;
    }
    const endLine = body.indexOf('\n', index); const end = endLine === -1 ? body.length : endLine;
    const line = body.slice(index, end).trim(); index = end + 1;
    if (line) output.push({ kind: 'line', line });
  }
  return output;
}

function executeStatements(body, scope, instance, invoke) {
  const statements = statementsFrom(body);
  for (const statement of statements) {
    if (statement.kind === 'when') {
      const result = executeStatements(evaluateExpression(statement.condition, scope) ? statement.yes : statement.no, scope, instance, invoke);
      if (result && result.returned) return result;
      continue;
    }
    if (statement.kind === 'each') {
      const collection = evaluateExpression(statement.collection, scope);
      if (!Array.isArray(collection)) throw new Error(`Each needs a list; ${statement.collection} is not a list.`);
      for (const value of collection) {
        const result = executeStatements(statement.body, { ...scope, [statement.item]: value }, instance, invoke);
        if (result && result.returned) return result;
      }
      continue;
    }
    const line = statement.line;
    if (line.startsWith('show ')) { pushConsole(String(evaluateExpression(line.slice(5), scope))); continue; }
    if (line.startsWith('give ')) return { returned: true, value: evaluateExpression(line.slice(5), scope) };
    const update = line.match(/^([A-Za-z][\w]*)\s*=\s*(.+)$/);
    if (update) {
      if (!Object.prototype.hasOwnProperty.call(instance.state, update[1])) throw new Error(`State ${update[1]} is not owned by ${instance.type.name}.`);
      instance.state[update[1]] = evaluateExpression(update[2], scope);
      scope[update[1]] = instance.state[update[1]];
      continue;
    }
    const message = line.match(/^(\w+)\.(\w+)\((.*)\)$/);
    if (message) { invoke(message[1], message[2], splitTopLevel(message[3]).map(value => evaluateExpression(value, scope))); continue; }
    throw new Error(`I cannot yet project this line: ${line}`);
  }
  return { returned: false, value: undefined };
}

function runProgram(program) {
  const instances = {};
  const invoke = (receiverName, methodName, args = []) => {
    const instance = instances[receiverName];
    if (!instance) throw new Error(`Unknown receiver: ${receiverName}. Create it with newjoe first.`);
    const method = instance.type.methods[methodName];
    if (!method) throw new Error(`${instance.type.name} does not observe a behavior named ${methodName}.`);
    if (method.params.length !== args.length) throw new Error(`${methodName} expects ${method.params.length} input${method.params.length === 1 ? '' : 's'}.`);
    const scope = { ...instance.state };
    method.params.forEach((param, index) => { scope[param] = args[index]; });
    return executeStatements(method.body, scope, instance, invoke).value;
  };
  for (const rawLine of program.topLevel.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const create = line.match(/^newjoe\s+(\w+)\s+as\s+(\w+)$/);
    if (create) {
      const type = program.types[create[1]];
      if (!type) throw new Error(`Unknown Joebject: ${create[1]}.`);
      instances[create[2]] = { type, state: Object.fromEntries(Object.entries(type.states).map(([key, value]) => [key, evaluateExpression(value, {})])) };
      pushConsole(`Observed ${create[2]} : ${create[1]}`);
      continue;
    }
    const visible = line.match(/^show\s+(\w+)\.(\w+)\((.*)\)$/);
    if (visible) { pushConsole(String(invoke(visible[1], visible[2], splitTopLevel(visible[3]).map(value => evaluateExpression(value, {}))))); continue; }
    const message = line.match(/^(\w+)\.(\w+)\((.*)\)$/);
    if (message) { invoke(message[1], message[2], splitTopLevel(message[3]).map(value => evaluateExpression(value, {}))); continue; }
    throw new Error(`Top-level source must create a Joebject or send it a message: ${line}`);
  }
  return instances;
}

function renderInspector(instances) {
  const entries = Object.entries(instances);
  if (!entries.length) { inspectorOutput.innerHTML = '<p class="empty-inspector">No instances were created.</p>'; return; }
  inspectorOutput.innerHTML = entries.map(([name, instance]) => {
    const stateRows = Object.entries(instance.state).map(([key, value]) => `<b>${key}</b><span>${Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}</span>`).join('');
    const behaviorList = Object.keys(instance.type.methods).join(', ') || 'none';
    return `<article class="inspector-card"><div class="inspector-type"><span>${name} : ${instance.type.name}</span><span>LIVE</span></div><div class="inspector-state">${stateRows || '<b>state</b><span>none</span>'}<b>does</b><span>${behaviorList}</span></div></article>`;
  }).join('');
}

function projectAndRun() {
  consoleOutput.innerHTML = '';
  try {
    const program = parseJoe(sourceEditor.value);
    renderProjection(program);
    const instances = runProgram(program);
    renderInspector(instances);
    setStatus(`Projection successful — ${Object.keys(instances).length} live instance${Object.keys(instances).length === 1 ? '' : 's'} observed.`, 'success');
  } catch (error) {
    projectionOutput.textContent = '// Projection paused.\n// Resolve the source finding and run again.';
    projectionStat.textContent = 'Projection not available';
    inspectorOutput.innerHTML = '<p class="empty-inspector">The inspector appears after a successful projection.</p>';
    pushConsole(error.message, true);
    setStatus(`Projection finding: ${error.message}`, 'error');
  }
}

function formatSource() {
  sourceEditor.value = sourceEditor.value.split('\n').map(line => line.replace(/\s+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  updateLineNumbers();
  setStatus('Source formatted. Ready to project.', 'ready');
}

sourceEditor.value = starters.greeter;
updateLineNumbers();
sourceEditor.addEventListener('input', updateLineNumbers);
sourceEditor.addEventListener('scroll', () => { lineNumbers.scrollTop = sourceEditor.scrollTop; });
document.querySelector('#run-button').addEventListener('click', projectAndRun);
document.querySelector('#format-button').addEventListener('click', formatSource);
document.querySelector('#clear-button').addEventListener('click', clearConsole);
starterSelect.addEventListener('change', event => { sourceEditor.value = starters[event.target.value]; updateLineNumbers(); setStatus(`Loaded ${event.target.options[event.target.selectedIndex].text} starter.`, 'ready'); sourceEditor.focus(); });
document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => {
  const insert = button.dataset.insert;
  const start = sourceEditor.selectionStart;
  const end = sourceEditor.selectionEnd;
  sourceEditor.setRangeText(insert, start, end, 'end');
  updateLineNumbers();
  sourceEditor.focus();
  setStatus(`Inserted ${button.querySelector('b').textContent}. Project when ready.`, 'ready');
}));

projectAndRun();
