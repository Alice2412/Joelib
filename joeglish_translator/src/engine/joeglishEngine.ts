import { BIJECTIVE_DICTIONARY } from './dictionary.ts';
import type { TranslationDirection, TranslationResult, WordMapping } from './types.ts';

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

  constructor() {
    this.initDictionary();
  }

  private initDictionary() {
    for (const [eng, joe] of Object.entries(BIJECTIVE_DICTIONARY)) {
      const e = eng.toLowerCase();
      const j = joe.toLowerCase();
      this.engToJoe.set(e, j);
      this.joeToEng.set(j, e);
    }
  }

  /**
   * Look up Joeglish translation of an English word.
   * If the word is not in the bijective dictionary (e.g. short words like "table" or unmapped words),
   * it remains unchanged, guaranteeing complete bijectivity.
   */
  public getJoeglishWord(rawWord: string): string {
    const w = rawWord.toLowerCase();
    if (this.engToJoe.has(w)) {
      return this.engToJoe.get(w)!;
    }
    return rawWord;
  }

  /**
   * Look up English translation of a Joeglish word.
   * If the word is not in the bijective dictionary, it remains unchanged.
   */
  public getEnglishWord(rawWord: string): string {
    const j = rawWord.toLowerCase();
    if (this.joeToEng.has(j)) {
      return this.joeToEng.get(j)!;
    }
    return rawWord;
  }

  /**
   * Detects if the provided text appears to be Joeglish.
   */
  public isJoeglishText(text: string): boolean {
    if (!text.trim()) return false;
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    for (const w of words) {
      if (this.joeToEng.has(w)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Translates text bijectively in the specified direction.
   */
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
      const lower = originalWord.toLowerCase();

      if (direction === 'en-to-joe') {
        const hasMapping = this.engToJoe.has(lower);
        const rawTranslated = hasMapping ? this.engToJoe.get(lower)! : originalWord;
        const translatedWord = applyCasing(rawTranslated, casing);
        translatedTokens.push(translatedWord);

        mappings.push({
          original: originalWord,
          translated: translatedWord,
          source: hasMapping ? 'seed' : 'preserved'
        });
      } else {
        const hasMapping = this.joeToEng.has(lower);
        const rawTranslated = hasMapping ? this.joeToEng.get(lower)! : originalWord;
        const translatedWord = applyCasing(rawTranslated, casing);
        translatedTokens.push(translatedWord);

        mappings.push({
          original: originalWord,
          translated: translatedWord,
          source: hasMapping ? 'seed' : 'preserved'
        });
      }
    }

    const translatedText = translatedTokens.join('');

    // Compute round-trip translation to verify bijection
    const inverseDirection: TranslationDirection = direction === 'en-to-joe' ? 'joe-to-en' : 'en-to-joe';
    const roundTripTokens: string[] = [];

    let rMatch: RegExpExecArray | null;
    const rTokenRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g;

    while ((rMatch = rTokenRegex.exec(translatedText)) !== null) {
      if (rMatch[1]) {
        const w = rMatch[1];
        const casing = detectCasing(w);
        const lower = w.toLowerCase();

        if (inverseDirection === 'en-to-joe') {
          const raw = this.engToJoe.has(lower) ? this.engToJoe.get(lower)! : w;
          roundTripTokens.push(applyCasing(raw, casing));
        } else {
          const raw = this.joeToEng.has(lower) ? this.joeToEng.get(lower)! : w;
          roundTripTokens.push(applyCasing(raw, casing));
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
