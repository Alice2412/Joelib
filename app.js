/* Joeriodic Table — vanilla JS, no build step.
 * Data: joelements.json over HTTP(S); embedded JSON snapshot under file://.
 * After JSON edits, update #offline-data in index.html too for double-click use.
 * All element labels are rendered as text; chemical symbols never change.
 */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formulaHTML = value => escapeHTML(value).replace(/(\d+)/g, '<sub>$1</sub>');
  const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, '').trim();
  const elementSymbols = formula => [...new Set(formula.match(/[A-Z][a-z]?/g) || [])];
  let data;
  const state = {family:'all', search:'', joeNames:false, compoundType:'all', compoundSearch:'', showAllCompounds:false, detailType:null, elementIndex:0, opener:null};
  let visibleElements = [];
  const dialog = $('#detail-dialog');

  function validateData(candidate) {
    if (!candidate || candidate.elements?.length !== 118 || !Array.isArray(candidate.compounds) || !Array.isArray(candidate.families) || !Array.isArray(candidate.ions) || !Array.isArray(candidate.stems) || candidate.prefixes?.length !== 10) throw new Error('The dataset is incomplete.');
    const symbols = new Set(), cells = new Set();
    candidate.elements.forEach((el,i) => {
      const cell = `${el.row},${el.column}`;
      if (el.number !== i+1 || !/^[A-Z][a-z]?$/.test(el.symbol) || symbols.has(el.symbol) || typeof el.name !== 'string' || typeof el.joeName !== 'string' || !candidate.families.some(f=>f.id===el.family) || !Number.isInteger(el.row) || !Number.isInteger(el.column) || el.row < 2 || el.row > 11 || el.column < 2 || el.column > 19 || cells.has(cell)) throw new Error('Invalid element record.');
      symbols.add(el.symbol);cells.add(cell);
    });
    candidate.compounds.forEach(c => {
      if (!['ionic','molecular','acid'].includes(c.type) || typeof c.id !== 'string' || typeof c.formula !== 'string' || typeof c.joeName !== 'string' || !Array.isArray(c.steps) || !elementSymbols(c.formula).every(s=>symbols.has(s))) throw new Error('Invalid compound record.');
    });
    return candidate;
  }

  async function loadData() {
    const snapshot = validateData(JSON.parse($('#offline-data').textContent));
    // Local files cannot reliably fetch neighbouring JSON. Use the bundled snapshot.
    if (!['http:','https:'].includes(location.protocol)) return snapshot;
    try {
      const response = await fetch('joelements.json', {signal:AbortSignal.timeout(2000),cache:'no-cache'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return validateData(await response.json());
    } catch (error) {
      console.warn('Using the bundled Joeriodic dataset:', error.message);
      $('#load-error').textContent = 'The JSON file could not be loaded, so the bundled offline dataset is in use. All features remain available.';
      $('#load-error').hidden = false;
      return snapshot;
    }
  }

  function familyName(id) {return data.families.find(f=>f.id===id)?.name || id;}
  function buildTable() {
    const table = $('#periodic-table');
    let html = '';
    for (let g=1;g<=18;g++) html += `<span class="group-number" style="grid-column:${g+1};grid-row:1" aria-label="Group ${g}">${g}</span>`;
    for (let p=1;p<=7;p++) html += `<span class="period-number" style="grid-column:1;grid-row:${p+1}" aria-label="Period ${p}">${p}</span>`;
    html += '<div class="table-intro" aria-hidden="true"><p class="eyebrow">THE JOERIODIC TABLE OF JOELEMENTS</p><h3>The symbols you know.<br><em>The Joes you don’t.</em></h3><p>Click any tile to discover its Joelement name, original identity, and place in the table.</p></div>';
    html += '<a class="series-placeholder family-lanthanide" href="#element-57" style="grid-column:4;grid-row:7" aria-label="Jump to lanthanides, elements 57 to 71"><span>57–71</span><span aria-hidden="true">↓</span></a><a class="series-placeholder family-actinide" href="#element-89" style="grid-column:4;grid-row:8" aria-label="Jump to actinides, elements 89 to 103"><span>89–103</span><span aria-hidden="true">↓</span></a>';
    html += '<span class="series-label" style="grid-row:10"><strong>Lanthanides</strong>57–71 / Period 6</span><span class="series-label" style="grid-row:11"><strong>Actinides</strong>89–103 / Period 7</span>';
    for (const el of data.elements) html += `<button type="button" id="element-${el.number}" class="element family-${escapeHTML(el.family)}" style="grid-column:${el.column};grid-row:${el.row}" data-number="${el.number}" aria-label="${el.number}, ${escapeHTML(el.symbol)}, ${escapeHTML(el.name)}. Reveal Joe name."><span class="element-number">${el.number}</span><span class="element-symbol">${escapeHTML(el.symbol)}</span><span class="element-name">${escapeHTML(el.name)}</span></button>`;
    table.innerHTML = html;
    $('#family-filters').innerHTML = '<button type="button" class="family-filter active" data-family="all" aria-pressed="true"><span class="family-dot"></span>All families</button>' + data.families.map(f=>`<button type="button" class="family-filter family-${escapeHTML(f.id)}" data-family="${escapeHTML(f.id)}" aria-pressed="false"><span class="family-dot"></span>${escapeHTML(f.name)}</button>`).join('');
    table.addEventListener('click', event => {
      const tile = event.target.closest('[data-number]');
      if (tile) openElement(Number(tile.dataset.number),tile);
      const anchor = event.target.closest('.series-placeholder');
      if (anchor) {
        event.preventDefault();const target = $(anchor.getAttribute('href'));
        target.scrollIntoView({block:'nearest',inline:'nearest'});target.focus();
      }
    });
    table.addEventListener('keydown', event => {
      const tile = event.target.closest('[data-number]');
      if (!tile || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      const current = data.elements[Number(tile.dataset.number)-1];let next;
      if (event.key==='ArrowLeft') next=data.elements[current.number-2];
      if (event.key==='ArrowRight') next=data.elements[current.number];
      if (event.key==='Home') next=data.elements[0];
      if (event.key==='End') next=data.elements[117];
      if (event.key==='ArrowUp') next=data.elements.filter(e=>e.column===current.column&&e.row<current.row).sort((a,b)=>b.row-a.row)[0];
      if (event.key==='ArrowDown') next=data.elements.filter(e=>e.column===current.column&&e.row>current.row).sort((a,b)=>a.row-b.row)[0];
      if (next) {event.preventDefault();$(`#element-${next.number}`).focus();}
    });
    $('#family-filters').addEventListener('click',event=>{
      const button=event.target.closest('[data-family]');if (!button)return;
      state.family=button.dataset.family;updateElements();
    });
  }

  function updateElements() {
    const query=normalize(state.search);
    visibleElements=data.elements.filter(el=>(state.family==='all'||el.family===state.family)&&(!query||[el.name,el.joeName,el.symbol,el.nickname||'',String(el.number)].some(value=>normalize(value).includes(query))));
    const matches=new Set(visibleElements.map(e=>e.number));
    for(const el of data.elements){
      const tile=$(`#element-${el.number}`), isMatch=matches.has(el.number);
      tile.classList.toggle('dimmed',!isMatch);
      tile.classList.toggle('match',isMatch&&Boolean(query));
      $('.element-name',tile).textContent=state.joeNames?el.joeName:el.name;
      tile.title=`${el.name} → ${el.joeName}`;
      tile.setAttribute('aria-label',`${el.number}, ${el.symbol}, ${el.name}${state.joeNames?`, ${el.joeName}`:'. Reveal Joe name'}.${isMatch?'':' Outside current filter.'}`);
    }
    $$('[data-family]').forEach(b=>{const active=b.dataset.family===state.family;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#element-status').textContent=visibleElements.length===118?'118 / 118 Joelements · select a tile to explore':`${visibleElements.length} / 118 Joelements match${visibleElements.length===0?' · try another name or reset filters':''}`;
    $('#reset-elements').hidden=state.family==='all'&&!state.search;
    $('#random-element').disabled=visibleElements.length===0;
    $('#names-toggle').setAttribute('aria-pressed',String(state.joeNames));
    $('#names-toggle').innerHTML=`${state.joeNames?'Show original names':'Show Joe names'} <span aria-hidden="true">↔</span>`;
  }

  function revealDialog(opener){
    if (!dialog.open){state.opener=opener||document.activeElement;dialog.showModal();document.body.classList.add('dialog-open');}
    dialog.scrollTop=0;
  }
  function openElement(number,opener){
    const el=data.elements.find(e=>e.number===number);if(!el)return;
    state.detailType='element';state.elementIndex=number-1;
    const duplicates=data.elements.filter(e=>e.number!==el.number&&normalize(e.joeName)===normalize(el.joeName));
    const nicknameDuplicates=el.nickname?data.elements.filter(e=>e.number!==el.number&&e.nickname===el.nickname):[];
    const related=data.compounds.filter(c=>elementSymbols(c.formula).includes(el.symbol)).slice(0,4);
    $('#detail-kicker').textContent=`ELEMENT ${String(el.number).padStart(3,'0')} / 118`;
    $('#detail-content').innerHTML=`<div class="detail-element-hero"><div class="detail-tile family-${escapeHTML(el.family)}" aria-hidden="true"><span class="element-number">${el.number}</span><span class="element-symbol">${escapeHTML(el.symbol)}</span><span class="element-name">${escapeHTML(el.name)}</span></div><div><h2 id="detail-title">${escapeHTML(el.joeName)}</h2><p class="source-name">The Joelement formerly known as ${escapeHTML(el.name)}.</p></div></div><dl class="detail-facts"><div><dt>Original symbol</dt><dd>${escapeHTML(el.symbol)}</dd></div><div><dt>Atomic number</dt><dd>${el.number}</dd></div><div><dt>Family</dt><dd>${escapeHTML(familyName(el.family))}</dd></div><div><dt>Period / group</dt><dd>${el.period} / ${el.group||'f-block series'}</dd></div><div><dt>Source Joe nickname</dt><dd>${el.nickname?escapeHTML(el.nickname):'Not supplied in CSV'}</dd></div><div><dt>In formulas</dt><dd>Always use ${escapeHTML(el.symbol)}</dd></div></dl>${related.length?'<p class="eyebrow">IN THE COMPOUND COLLECTION</p><div class="detail-elements">'+related.map(c=>`<button type="button" data-related-compound="${escapeHTML(c.id)}" aria-label="Explore ${escapeHTML(c.name)}">${formulaHTML(c.formula)}</button>`).join('')+'</div>':''}<p class="detail-note">Name and ${el.nickname?'nickname':'capitalization'} preserved from your CSV.${duplicates.length?' This Joe name is also used for '+duplicates.map(e=>escapeHTML(e.name)+' ('+e.symbol+')').join(', ')+'.':''}${nicknameDuplicates.length?' This nickname is also used for '+nicknameDuplicates.map(e=>escapeHTML(e.name)+' ('+e.symbol+')').join(', ')+'.':''} The original symbol identifies this Joelement unambiguously.</p>`;
    $('#element-navigation').hidden=false;
    $('#element-position').textContent=`${number} / 118`;
    $('#previous-element').disabled=number===1;$('#next-element').disabled=number===118;
    revealDialog(opener);
  }

  function openCompound(id,opener){
    const c=data.compounds.find(item=>item.id===id);if(!c)return;
    state.detailType='compound';
    $('#detail-kicker').textContent=`COMPOUND / ${c.type==='acid'?'ACID':c.type.toUpperCase()}`;
    const symbols=elementSymbols(c.formula);
    $('#detail-content').innerHTML=`<article class="detail-compound"><div class="detail-compound-formula" aria-label="${escapeHTML(c.formula)}">${formulaHTML(c.formula)}</div><h2 id="detail-title">${escapeHTML(c.joeName)}</h2><p class="standard-name">${escapeHTML(c.name)} · ${escapeHTML(c.common)}</p><p>${escapeHTML(c.description)}</p><h3>The naming breakdown</h3><ol class="breakdown-list">${c.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol><h3>Meet the Joelements inside</h3><div class="detail-elements">${symbols.map(s=>{const el=data.elements.find(e=>e.symbol===s);return `<button type="button" data-related-element="${el.number}">${escapeHTML(s)} · ${escapeHTML(el.joeName)}</button>`;}).join('')}</div><p class="detail-note">A fictional Joe name created for this website. The formula and standard name refer to real chemistry.</p></article>`;
    $('#element-navigation').hidden=true;revealDialog(opener);
  }

  function updateCompounds(){
    const query=normalize(state.compoundSearch);
    const matches=data.compounds.filter(c=>(state.compoundType==='all'||c.type===state.compoundType)&&(!query||[c.formula,c.name,c.joeName,c.common].some(v=>normalize(v).includes(query))));
    const displayed=state.showAllCompounds?matches:matches.slice(0,6);
    $('#compound-grid').innerHTML=displayed.map(c=>`<button type="button" class="compound-card" data-id="${escapeHTML(c.id)}" aria-label="${escapeHTML(c.formula)}: ${escapeHTML(c.joeName)}. View naming breakdown."><span class="compound-top"><span class="compound-formula">${formulaHTML(c.formula)}</span><span class="compound-badge ${escapeHTML(c.type)}">${c.type==='acid'?'Acid':escapeHTML(c.type)}</span></span><span class="compound-joe">${escapeHTML(c.joeName)}</span><span class="standard-name">${escapeHTML(c.name)}</span><span class="compound-bottom"><span>${escapeHTML(c.common)}</span><span aria-hidden="true">↗</span></span></button>`).join('');
    $('#compound-status').textContent=`Showing ${displayed.length} of ${matches.length} compound${matches.length===1?'':'s'}${query?' matching your search':''}`;
    $('#compound-empty').hidden=matches.length>0;
    $('#show-compounds').hidden=matches.length<=6;
    $('#show-compounds').innerHTML=state.showAllCompounds?'Show fewer compounds <span aria-hidden="true">↑</span>':`Explore all ${matches.length} compounds <span aria-hidden="true">↓</span>`;
    $$('[data-compound]').forEach(b=>{const active=b.dataset.compound===state.compoundType;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }

  function setRule(type,focus=false){
    $$('[data-rule]').forEach(tab=>{
      const selected=tab.dataset.rule===type;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      $(`#panel-${tab.dataset.rule}`).hidden=!selected;
      if(selected&&focus)tab.focus();
    });
  }
  function buildReferences(){
    $('#stem-body').innerHTML=data.stems.map(s=>`<tr><td>${escapeHTML(s.symbol)}</td><td>${escapeHTML(s.joeName)}</td><td>${escapeHTML(s.stem)}-</td></tr>`).join('');
    $('#ion-body').innerHTML=data.ions.map(i=>`<tr><td>${escapeHTML(i.formula)}</td><td>${escapeHTML(i.name)}</td><td>${escapeHTML(i.joeName)}</td></tr>`).join('');
    $('#prefix-list').innerHTML=data.prefixes.map((p,i)=>`<div class="prefix-item"><span>${i+1}</span>${escapeHTML(p)}-</div>`).join('');
  }
  function bindEvents(){
    $('#element-search').addEventListener('input',event=>{state.search=event.target.value;updateElements();});
    $('#element-search').addEventListener('keydown',event=>{if(event.key==='Enter'&&visibleElements.length){event.preventDefault();openElement(visibleElements[0].number,event.target);}});
    $('#names-toggle').addEventListener('click',()=>{state.joeNames=!state.joeNames;updateElements();});
    $('#reset-elements').addEventListener('click',()=>{state.search='';state.family='all';$('#element-search').value='';updateElements();});
    $('#random-element').addEventListener('click',event=>{const el=visibleElements[Math.floor(Math.random()*visibleElements.length)];if(el)openElement(el.number,event.currentTarget);});
    $('#close-dialog').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');state.detailType=null;if(state.opener?.isConnected)state.opener.focus({preventScroll:true});});
    // Pointer down AND up must be outside the dialog to count as a backdrop click.
    let backdropStart=false;
    const outside=event=>{const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;};
    dialog.addEventListener('pointerdown',event=>{backdropStart=event.target===dialog&&outside(event);});
    dialog.addEventListener('click',event=>{if(backdropStart&&event.target===dialog&&outside(event))dialog.close();backdropStart=false;});
    $('#previous-element').addEventListener('click',()=>{if(state.elementIndex>0)openElement(state.elementIndex);});
    $('#next-element').addEventListener('click',()=>{if(state.elementIndex<117)openElement(state.elementIndex+2);});
    dialog.addEventListener('keydown',event=>{
      if(state.detailType!=='element')return;
      if(event.key==='ArrowLeft'&&state.elementIndex>0){event.preventDefault();openElement(state.elementIndex);}
      if(event.key==='ArrowRight'&&state.elementIndex<117){event.preventDefault();openElement(state.elementIndex+2);}
    });
    $('#detail-content').addEventListener('click',event=>{
      const compound=event.target.closest('[data-related-compound]');const el=event.target.closest('[data-related-element]');
      if(compound)openCompound(compound.dataset.relatedCompound);
      if(el)openElement(Number(el.dataset.relatedElement));
      if(compound||el)$('#close-dialog').focus();
    });
    $$('[data-rule]').forEach(tab=>{
      tab.addEventListener('click',()=>setRule(tab.dataset.rule));
      tab.addEventListener('keydown',event=>{
        const tabs=$$('[data-rule]');const i=tabs.indexOf(tab);let target;
        if(['ArrowDown','ArrowRight'].includes(event.key))target=tabs[(i+1)%tabs.length];
        if(['ArrowUp','ArrowLeft'].includes(event.key))target=tabs[(i+tabs.length-1)%tabs.length];
        if(event.key==='Home')target=tabs[0];if(event.key==='End')target=tabs.at(-1);
        if(target){event.preventDefault();setRule(target.dataset.rule,true);}
      });
    });
    $$('[data-compound]').forEach(button=>button.addEventListener('click',()=>{state.compoundType=button.dataset.compound;state.showAllCompounds=false;updateCompounds();}));
    $('#compound-search').addEventListener('input',event=>{state.compoundSearch=event.target.value;state.showAllCompounds=false;updateCompounds();});
    $('#compound-grid').addEventListener('click',event=>{const card=event.target.closest('[data-id]');if(card)openCompound(card.dataset.id,card);});
    $('#show-compounds').addEventListener('click',()=>{const wasExpanded=state.showAllCompounds;state.showAllCompounds=!state.showAllCompounds;updateCompounds();if(wasExpanded)$('#compounds').scrollIntoView({block:'start'});});
  }
  async function init(){
    try{data=await loadData();buildTable();buildReferences();bindEvents();updateElements();updateCompounds();}
    catch(error){console.error(error);$('#element-status').textContent='The table could not be loaded.';$('#load-error').hidden=false;$('#load-error').textContent='Please keep index.html, styles.css, app.js, and joelements.json in the same folder. The bundled data may be missing or invalid.';}
  }
  init();
})();
