import { SEED_DICTIONARY } from './dictionary.ts';
import { WORDBANK } from './wordbank.ts';
import type { TranslationDirection, TranslationResult, WordMapping } from './types.ts';

function fnv1aHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Short words and common particles that remain unchanged
const PRESERVED_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'but', 'nor', 'so', 'yet',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their',
  'this', 'that', 'these', 'those',
  'as', 'if', 'then', 'than', 'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'not', 'no', 'yes', 'can', 'will', 'may', 'shall', 'do', 'does', 'did', 'have', 'has', 'had',
  'there', 'here', 'into', 'some', 'more', 'such', 'also', 'other', 'only', 'even', 'most',
  'make', 'take', 'good', 'look', 'time', 'year', 'said', 'each', 'just', 'like', 'come'
]);

function splitSyllables(word: string): string[] {
  const w = word.toLowerCase();
  const vowelRegex = /[aeiouy]+/g;
  const matches = [...w.matchAll(vowelRegex)];
  if (matches.length <= 1) return [w];

  const cuts: number[] = [];
  for (let i = 0; i < matches.length - 1; i++) {
    const v1End = (matches[i].index ?? 0) + matches[i][0].length;
    const v2Start = matches[i + 1].index ?? 0;
    const consLen = v2Start - v1End;
    let cut: number;
    if (consLen <= 1) {
      cut = v1End;
    } else {
      cut = v1End + Math.floor(consLen / 2);
    }
    cuts.push(cut);
  }

  const syllables: string[] = [];
  let prev = 0;
  for (const c of cuts) {
    syllables.push(w.slice(prev, c));
    prev = c;
  }
  syllables.push(w.slice(prev));
  return syllables;
}

type CasingType = 'uppercase' | 'titlecase' | 'lowercase';

function detectCasing(word: string): CasingType {
  if (word.length === 0) return 'lowercase';
  if (word === word.toUpperCase() && /[A-Z]/.test(word)) return 'uppercase';
  if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) return 'titlecase';
  return 'lowercase';
}

function applyCasing(word: string, casing: CasingType): string {
  if (!word) return word;
  if (casing === 'uppercase') return word.toUpperCase();
  if (casing === 'titlecase') {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return word.toLowerCase();
}

export class JoeglishEngine {
  private engToJoe = new Map<string, string>();
  private joeToEng = new Map<string, string>();
  private seedWords = new Set<string>();

  constructor() {
    this.initSeedDictionary();
    this.preindexWordbank();
  }

  private initSeedDictionary() {
    for (const [eng, joe] of Object.entries(SEED_DICTIONARY)) {
      const e = eng.toLowerCase();
      const j = joe.toLowerCase();
      this.engToJoe.set(e, j);
      this.joeToEng.set(j, e);
      this.seedWords.add(e);
      this.seedWords.add(j);
    }
  }

  private preindexWordbank() {
    for (const word of WORDBANK) {
      this.getJoeglishWord(word);
    }
  }

  public getJoeglishWord(rawWord: string): string {
    const w = rawWord.toLowerCase();

    if (this.engToJoe.has(w)) {
      return this.engToJoe.get(w)!;
    }

    // Short words (length <= 5 or in PRESERVED_WORDS): remain unchanged
    const syls = splitSyllables(w);
    if (w.length <= 5 || PRESERVED_WORDS.has(w) || syls.length < 2) {
      this.engToJoe.set(w, w);
      this.joeToEng.set(w, w);
      return w;
    }

    // Long words (length >= 6 and at least 2 syllables):
    const h = fnv1aHash(w);
    let chosen = '';

    for (let attempt = 0; attempt < syls.length; attempt++) {
      const idx = (h + attempt) % syls.length;
      const candidateParts = [...syls];
      candidateParts[idx] = 'joe';
      const cand = candidateParts.join('');

      if (cand !== w && (!this.joeToEng.has(cand) || this.joeToEng.get(cand) === w)) {
        chosen = cand;
        break;
      }
    }

    if (!chosen) {
      const cand = 'joe' + w.slice(syls[0].length);
      if (!this.joeToEng.has(cand) || this.joeToEng.get(cand) === w) {
        chosen = cand;
      } else {
        chosen = w;
      }
    }

    this.engToJoe.set(w, chosen);
    this.joeToEng.set(chosen, w);
    return chosen;
  }

  public getEnglishWord(rawWord: string): string {
    const j = rawWord.toLowerCase();

    // 1. Direct reverse lookup
    if (this.joeToEng.has(j)) {
      return this.joeToEng.get(j)!;
    }

    // 2. If word contains "joe", recover original English candidate
    if (j.includes('joe')) {
      const candidate = this.recoverEnglishFromJoe(j);
      if (candidate) {
        this.engToJoe.set(candidate, j);
        this.joeToEng.set(j, candidate);
        return candidate;
      }
    }

    // 3. Word does not contain "joe" or cannot be mapped: return unchanged without corrupting maps
    return rawWord;
  }

  private recoverEnglishFromJoe(joeWord: string): string {
    // Check candidate syllable replacements against indexed words
    const commonPrefixes = ['en', 're', 'con', 'per', 'in', 'ex', 'de', 'pro', 'trans', 'com', 'sub', 'inter', 'gen', 'el', 'he', 'gat'];
    for (const p of commonPrefixes) {
      const cand = joeWord.replace(/joe/i, p);
      if (this.engToJoe.has(cand) && this.engToJoe.get(cand) === joeWord) {
        return cand;
      }
    }

    // Search wordbank words whose joeglish transformation equals joeWord
    for (const w of WORDBANK) {
      if (this.getJoeglishWord(w) === joeWord) {
        return w;
      }
    }

    // Fallback: replace joe with 'en' or onset
    return joeWord.replace(/joe/i, 'en');
  }

  public isJoeglishText(text: string): boolean {
    if (!text.trim()) return false;
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let joeCount = 0;
    for (const w of words) {
      if (w.includes('joe') || (this.joeToEng.has(w) && this.joeToEng.get(w) !== w)) {
        joeCount++;
      }
    }
    return joeCount > 0;
  }

  public translate(text: string, direction: TranslationDirection): TranslationResult {
    if (!text) {
      return {
        translatedText: '',
        mappings: [],
        roundTripText: '',
        isBijectiveRoundTrip: true
      };
    }

    const tokenRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g;
    const tokens: Array<{ text: string; isWord: boolean }> = [];

    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(text)) !== null) {
      if (match[1]) {
        tokens.push({ text: match[1], isWord: true });
      } else if (match[2]) {
        tokens.push({ text: match[2], isWord: false });
      }
    }

    const mappings: WordMapping[] = [];
    const translatedTokens: string[] = [];

    for (const token of tokens) {
      if (!token.isWord) {
        translatedTokens.push(token.text);
        continue;
      }

      const originalWord = token.text;
      const casing = detectCasing(originalWord);

      if (direction === 'en-to-joe') {
        const rawTranslated = this.getJoeglishWord(originalWord);
        const translatedWord = applyCasing(rawTranslated, casing);
        translatedTokens.push(translatedWord);

        mappings.push({
          original: originalWord,
          translated: translatedWord,
          source: this.seedWords.has(originalWord.toLowerCase()) ? 'seed' : 'generated'
        });
      } else {
        const rawTranslated = this.getEnglishWord(originalWord);
        const translatedWord = applyCasing(rawTranslated, casing);
        translatedTokens.push(translatedWord);

        mappings.push({
          original: originalWord,
          translated: translatedWord,
          source: this.seedWords.has(originalWord.toLowerCase()) ? 'seed' : 'generated'
        });
      }
    }

    const translatedText = translatedTokens.join('');

    // Compute round-trip translation
    const inverseDirection: TranslationDirection = direction === 'en-to-joe' ? 'joe-to-en' : 'en-to-joe';
    const roundTripTokens: string[] = [];

    let rMatch: RegExpExecArray | null;
    const rTokenRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g;

    while ((rMatch = rTokenRegex.exec(translatedText)) !== null) {
      if (rMatch[1]) {
        const w = rMatch[1];
        const casing = detectCasing(w);
        if (inverseDirection === 'en-to-joe') {
          roundTripTokens.push(applyCasing(this.getJoeglishWord(w), casing));
        } else {
          roundTripTokens.push(applyCasing(this.getEnglishWord(w), casing));
        }
      } else if (rMatch[2]) {
        roundTripTokens.push(rMatch[2]);
      }
    }

    const roundTripText = roundTripTokens.join('');
    const isBijectiveRoundTrip = roundTripText.trim() === text.trim();

    return {
      translatedText,
      mappings,
      roundTripText,
      isBijectiveRoundTrip
    };
  }
}

export const engine = new JoeglishEngine();
