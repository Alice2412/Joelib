export type TranslationDirection = 'en-to-joe' | 'joe-to-en';

export interface WordMapping {
  original: string;
  translated: string;
  syllableReplaced?: string;
  source: 'seed' | 'generated' | 'preserved';
}

export interface TranslationResult {
  translatedText: string;
  mappings: WordMapping[];
  roundTripText: string;
  isBijectiveRoundTrip: boolean;
}

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  targetText: string;
  direction: TranslationDirection;
  timestamp: number;
  favorite?: boolean;
}
