// Generator script for Joegle Translate Bijective Dictionary
// Generates at least 5000 verified 1-to-1 bijective pairs for long words
// based on Corpus of Contemporary American English (entries.pdf).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Core curated base terms (lore, elements, standard examples)
const SEED_PAIRS = [
  ['element', 'joelement'],
  ['elements', 'joelements'],
  ['elementary', 'joelementary'],
  ['translator', 'joeslator'],
  ['translators', 'joeslators'],
  ['translate', 'joeslate'],
  ['translates', 'joeslates'],
  ['translated', 'joeslated'],
  ['translating', 'joeslating'],
  ['translation', 'joeslation'],
  ['translations', 'joeslations'],
  ['english', 'joeglish'],
  ['periodic', 'joeriodic'],
  ['google', 'joegle'],
  ['gatsby', 'joetsby'],
  ['fitzgerald', 'fitzjoerald'],
  ['pokemon', 'joekemon'],
  ['developer', 'devjoeloper'],
  ['developers', 'devjoelopers'],
  ['development', 'devjoelopment'],
  ['developments', 'devjoelopments'],
  ['government', 'govjoernment'],
  ['governments', 'govjoernments'],
  ['technology', 'techjoelogy'],
  ['technologies', 'techjoelogies'],
  ['understand', 'underjoestand'],
  ['understands', 'underjoestands'],
  ['understanding', 'underjoestanding'],
  ['understood', 'underjoeod'],
  ['chocolate', 'chocjoelet'],
  ['chocolates', 'chocjoelets'],
  ['beautiful', 'beautijoeful'],
  ['wonderful', 'wonderjoeful'],
  ['yesterday', 'yesterjoeday'],
  ['hydrogen', 'hydjoejin'],
  ['helium', 'joelium'],
  ['lithium', 'joeithium'],
  ['beryllium', 'joeeryllium'],
  ['nitrogen', 'joeitrojin'],
  ['oxygen', 'joexyjin'],
  ['magnesium', 'joeagnesium'],
  ['aluminum', 'alujoenium'],
  ['potassium', 'joetassium'],
  ['titanium', 'tijoeanium'],
  ['vanadium', 'joeanadium'],
  ['germanium', 'joermanium'],
  ['selenium', 'joelenium'],
  ['rubidium', 'joebidium'],
  ['strontium', 'strjoentium'],
  ['zirconium', 'zirjoenium'],
  ['molybdenum', 'joelybdenum'],
  ['technetium', 'technejoetium'],
  ['ruthenium', 'rujoenium'],
  ['palladium', 'joelladium'],
  ['platinum', 'platijoe'],
  ['mercury', 'merjoery'],
  ['uranium', 'joeranium'],
  ['plutonium', 'plutjoenium'],
  ['americium', 'amerijoenium'],
  ['californium', 'joelifornium'],
  ['einsteinium', 'joensteinium'],
  ['copernicium', 'coperjoeicium']
];

// Prefix transformation rules
const PREFIXES = [
  ['trans', 'joes'],
  ['inter', 'joen'],
  ['tele', 'joe'],
  ['auto', 'joe'],
  ['gen', 'joe'],
  ['geo', 'joeg'],
  ['pro', 'joe'],
  ['per', 'joe'],
  ['con', 'joe'],
  ['com', 'joe'],
  ['col', 'joe'],
  ['cor', 'joe'],
  ['uni', 'joe'],
  ['el', 'joe'],
  ['en', 'joe'],
  ['dis', 'joe'],
  ['sub', 'joe'],
  ['de', 'joe'],
  ['re', 'joe']
];

// Suffix transformation rules
const SUFFIXES = [
  ['tion', 'tjoen'],
  ['sion', 'sjoen'],
  ['ment', 'joement'],
  ['ship', 'joeship'],
  ['ology', 'joelogy'],
  ['able', 'joeble'],
  ['ible', 'joeble'],
  ['ful', 'joeful'],
  ['ness', 'joeness'],
  ['less', 'joeless'],
  ['ball', 'joeball']
];

function generateCandidates(w) {
  const cands = [];

  // 1. Prefix replacement
  for (const [pre, rep] of PREFIXES) {
    if (w.startsWith(pre) && w.length - pre.length >= 4) {
      const cand = rep + w.slice(pre.length);
      if (!cand.startsWith('jj')) {
        cands.push(cand);
      }
    }
  }

  // 2. Suffix replacement (words length >= 8)
  if (w.length >= 8) {
    for (const [suf, rep] of SUFFIXES) {
      if (w.endsWith(suf) && w.length - suf.length >= 4) {
        cands.push(w.slice(0, -suf.length) + rep);
      }
    }
  }

  // 3. Initial vowel replacement for long words (e.g. academic -> joecademic, activity -> joectivity)
  if (/^[aeiouy]/.test(w) && w.length >= 7) {
    cands.push('joe' + w.slice(1));
    const vm = w.match(/^[aeiouy]+/);
    if (vm && w.length - vm[0].length >= 4) {
      cands.push('joe' + w.slice(vm[0].length));
    }
  }

  // 4. Infix replacement of middle vowel cluster
  const sub = w.slice(2);
  const vm = sub.match(/[aeiouy]+/);
  if (vm && vm.index !== undefined) {
    const start = 2 + vm.index;
    const end = start + vm[0].length;
    if (w.length - end >= 3) {
      const cand = w.slice(0, start) + 'joe' + w.slice(end);
      if (!cand.includes('jj')) {
        cands.push(cand);
      }
    }
  }

  // 5. Clean insertion after onset
  if (w.length >= 8) {
    cands.push(w.slice(0, 3) + 'joe' + w.slice(4));
  }

  return cands;
}

function ensureWordsList() {
  const jsonPath = path.join(__dirname, 'entries_words.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  // Run python extractor if json not found
  console.log('entries_words.json not found, running parse_pdf.py...');
  const pyScript = path.join(__dirname, 'parse_pdf.py');
  execFileSync('python', [pyScript], { stdio: 'inherit' });
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

export function buildBijectiveDictionary(targetCount = 5200) {
  console.log('--- Generating Joeglish Bijective Dictionary ---');

  const words = ensureWordsList();
  console.log(`Loaded ${words.length} candidate words from entries.pdf`);

  const engToJoe = new Map();
  const joeToEng = new Map();
  const allEngWords = new Set();

  // Prepopulate English words set to prevent collisions with real English words
  for (const w of words) {
    allEngWords.add(w.toLowerCase());
  }

  // 1. Seed base pairs
  for (const [eng, joe] of SEED_PAIRS) {
    const e = eng.toLowerCase();
    const j = joe.toLowerCase();
    engToJoe.set(e, j);
    joeToEng.set(j, e);
    allEngWords.add(e);
  }

  // 2. Process words from entries.pdf
  for (const raw of words) {
    const w = raw.toLowerCase().trim();
    if (w.length < 7 || w.includes('joe') || engToJoe.has(w)) {
      continue;
    }

    const cands = generateCandidates(w);
    let chosen = null;

    for (const c of cands) {
      if (
        c.includes('joe') &&
        !c.includes('jj') &&
        !joeToEng.has(c) &&
        !allEngWords.has(c) &&
        c !== w
      ) {
        chosen = c;
        break;
      }
    }

    if (chosen) {
      engToJoe.set(w, chosen);
      joeToEng.set(chosen, w);
      if (engToJoe.size >= targetCount) {
        break;
      }
    }
  }

  console.log(`Generated ${engToJoe.size} bijective word pairs (Target was >= ${targetCount}).`);

  // Bijectivity Assertions
  const errors = [];
  if (engToJoe.size < 5000) {
    errors.push(`Dictionary size ${engToJoe.size} is less than required 5000 words.`);
  }

  if (engToJoe.size !== joeToEng.size) {
    errors.push(`Mismatch between forward (${engToJoe.size}) and reverse (${joeToEng.size}) mappings.`);
  }

  for (const [e, j] of engToJoe.entries()) {
    if (e.length < 6) {
      errors.push(`Word "${e}" is shorter than 6 characters.`);
    }
    if (!j.includes('joe')) {
      errors.push(`Translation "${j}" for "${e}" does not contain "joe".`);
    }
    if (e === j) {
      errors.push(`Translation equals original for "${e}".`);
    }
    if (joeToEng.get(j) !== e) {
      errors.push(`Bijectivity violation: ${e} -> ${j} -> ${joeToEng.get(j)}`);
    }
    if (joeToEng.has(e)) {
      errors.push(`English word "${e}" exists in Joeglish codomain.`);
    }
  }

  if (errors.length > 0) {
    console.error(`FATAL: ${errors.length} validation errors:`);
    for (const err of errors.slice(0, 10)) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  }

  // Sort entries alphabetically
  const sortedDict = {};
  const sortedKeys = Array.from(engToJoe.keys()).sort();
  for (const k of sortedKeys) {
    sortedDict[k] = engToJoe.get(k);
  }

  const outDir = path.resolve(__dirname, '../src/engine');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tsFilePath = path.join(outDir, 'dictionary.ts');
  const jsonFilePath = path.join(outDir, 'dictionary.json');

  const tsContent = `// AUTO-GENERATED BY scripts/generateDictionary.js - DO NOT EDIT MANUALLY
// Truly bijective Joeglish <-> English mapping
// Total word pairs: ${sortedKeys.length}

export const BIJECTIVE_DICTIONARY: Record<string, string> = ${JSON.stringify(sortedDict, null, 2)};
`;

  fs.writeFileSync(tsFilePath, tsContent, 'utf-8');
  fs.writeFileSync(jsonFilePath, JSON.stringify(sortedDict, null, 2), 'utf-8');

  console.log(`Successfully generated and verified ${sortedKeys.length} word pairs.`);
  console.log(`Written to:\n  ${tsFilePath}\n  ${jsonFilePath}`);
  console.log('Bijectivity: 100% verified (E <-> J is strictly 1-to-1).');
}

// Run directly if called as a script
buildBijectiveDictionary(5200);
