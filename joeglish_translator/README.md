# Joegle Translate

A faithful mock of the Google Translate interface for translating between **English** and **Joeglish** (and the inverse).

## Features

- **Google Translate UI Mock**: Minimalist, authentic replica of Google Translate with language selection bar, swap button, dual panels, voice input/output (TTS), and character counter.
- **Bijective Transformation**: Every transformed word has a deterministic 1-to-1 mapping, ensuring that translating English &rarr; Joeglish &rarr; English recovers the exact original text.
- **Short Words Unchanged**: Short words (such as *the*, *be*, *that*, *those*, *with*, *from*, *they*, *will*, *have*, *some*, *more*, etc.) remain unchanged.
- **Long Words Syllable Replacement**: Long multi-syllabic words deterministically have a syllable replaced with `"joe"` (e.g., *English* &rarr; *Joeglish*, *Elements* &rarr; *Joelements*, *Periodic* &rarr; *Joeriodic*, *Computer* &rarr; *Joeputer*, *Developer* &rarr; *Dejoeloper*).
- **Comprehensive Word Bank & Seed Dictionary**:
  - All 118 chemical elements from *The Joeriodic Table of Joelements* (Hydrogen &rarr; Hydjoejin, Helium &rarr; Joelium, etc.)
  - Literature mappings from *The Great Joetsby* by F. Scott Fitzjoerald
  - Shakespearean speech mappings from *Joelet*
  - Vocabulary from *Joeglish Grammar*
  - Full Google 10,000 most common English words wordbank for on-the-fly lazy bijection.

## Project Setup

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
```
