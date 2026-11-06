<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { engine } from '../engine/joeglishEngine.ts';
import type { TranslationDirection, TranslationResult, TranslationHistoryItem } from '../engine/types.ts';

type SourceMode = 'detect' | 'en' | 'joe';

const props = defineProps<{
  historyItems: TranslationHistoryItem[];
}>();

const emit = defineEmits<{
  (e: 'open-drawer', tab: 'history' | 'saved'): void;
  (e: 'save-translation', item: { source: string; target: string; direction: TranslationDirection }): void;
  (e: 'toggle-star-current', id?: string): void;
}>();

const sourceMode = ref<SourceMode>('detect');
const targetLang = ref<'en' | 'joe'>('joe');
const sourceText = ref<string>('');
const isSwapAnimating = ref<boolean>(false);
const copyTooltip = ref<boolean>(false);
const isListening = ref<boolean>(false);
const isSpeaking = ref<boolean>(false);
const isLiked = ref<boolean>(false);
const isDisliked = ref<boolean>(false);

// Auto-detected language
const detectedLang = computed<'en' | 'joe'>(() => {
  if (!sourceText.value.trim()) return 'en';
  return engine.isJoeglishText(sourceText.value) ? 'joe' : 'en';
});

// Effective direction for translation
const effectiveDirection = computed<TranslationDirection>(() => {
  if (sourceMode.value === 'detect') {
    return detectedLang.value === 'joe' ? 'joe-to-en' : 'en-to-joe';
  }
  return sourceMode.value === 'joe' ? 'joe-to-en' : 'en-to-joe';
});

// Keep target tab aligned with direction
watch(effectiveDirection, (dir) => {
  targetLang.value = dir === 'en-to-joe' ? 'joe' : 'en';
}, { immediate: true });

const translationResult = ref<TranslationResult>({
  translatedText: '',
  mappings: [],
  roundTripText: '',
  isBijectiveRoundTrip: true
});

// Check if current translation is starred
const currentIsStarred = computed<boolean>(() => {
  if (!sourceText.value.trim() || !translationResult.value.translatedText.trim()) return false;
  const match = props.historyItems.find(
    h => h.sourceText.trim() === sourceText.value.trim() && h.direction === effectiveDirection.value
  );
  return !!match?.favorite;
});

let saveTimer: any = null;

function performTranslation() {
  translationResult.value = engine.translate(sourceText.value, effectiveDirection.value);

  // Auto-record history with debounce
  if (saveTimer) clearTimeout(saveTimer);
  if (sourceText.value.trim().length >= 2 && translationResult.value.translatedText.trim()) {
    saveTimer = setTimeout(() => {
      emit('save-translation', {
        source: sourceText.value,
        target: translationResult.value.translatedText,
        direction: effectiveDirection.value
      });
    }, 600);
  }
}

watch(sourceText, () => {
  performTranslation();
});

watch(effectiveDirection, () => {
  performTranslation();
});

function handleSwap() {
  isSwapAnimating.value = true;
  setTimeout(() => {
    isSwapAnimating.value = false;
  }, 300);

  const prevSource = sourceText.value;
  const prevTarget = translationResult.value.translatedText;

  // Swap language modes
  if (effectiveDirection.value === 'en-to-joe') {
    sourceMode.value = 'joe';
    targetLang.value = 'en';
  } else {
    sourceMode.value = 'en';
    targetLang.value = 'joe';
  }

  // Swap texts
  sourceText.value = prevTarget || prevSource;
  performTranslation();
}

function selectSource(mode: SourceMode) {
  sourceMode.value = mode;
  if (mode === 'en') {
    targetLang.value = 'joe';
  } else if (mode === 'joe') {
    targetLang.value = 'en';
  }
  performTranslation();
}

function selectTarget(lang: 'en' | 'joe') {
  targetLang.value = lang;
  if (lang === 'en') {
    sourceMode.value = 'joe';
  } else {
    sourceMode.value = 'en';
  }
  performTranslation();
}

function clearSource() {
  sourceText.value = '';
  translationResult.value = {
    translatedText: '',
    mappings: [],
    roundTripText: '',
    isBijectiveRoundTrip: true
  };
}

async function copyTranslation() {
  if (!translationResult.value.translatedText) return;
  try {
    await navigator.clipboard.writeText(translationResult.value.translatedText);
    copyTooltip.value = true;
    setTimeout(() => {
      copyTooltip.value = false;
    }, 2000);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
}

function speakText(text: string) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  
  utterance.onstart = () => { isSpeaking.value = true; };
  utterance.onend = () => { isSpeaking.value = false; };
  utterance.onerror = () => { isSpeaking.value = false; };
  
  window.speechSynthesis.speak(utterance);
}

function toggleVoiceInput() {
  const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition 
    || (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognition) return;

  if (isListening.value) {
    isListening.value = false;
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => { isListening.value = true; };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sourceText.value = (sourceText.value ? sourceText.value + ' ' : '') + transcript;
      isListening.value = false;
    };
    recognition.onerror = () => { isListening.value = false; };
    recognition.onend = () => { isListening.value = false; };

    recognition.start();
  } catch {
    isListening.value = false;
  }
}

function handleShare() {
  if (!translationResult.value.translatedText) return;
  if (navigator.share) {
    navigator.share({
      title: 'Joegle Translate',
      text: translationResult.value.translatedText
    }).catch(() => {});
  } else {
    copyTranslation();
  }
}

// Method to load an item externally (from History/Saved drawer)
function loadHistoryItem(item: TranslationHistoryItem) {
  if (item.direction === 'en-to-joe') {
    sourceMode.value = 'en';
    targetLang.value = 'joe';
  } else {
    sourceMode.value = 'joe';
    targetLang.value = 'en';
  }
  sourceText.value = item.sourceText;
  performTranslation();
}

defineExpose({
  loadHistoryItem
});
</script>

<template>
  <div class="translate-page-container">
    <!-- Language Selector Bar matching screenshot -->
    <div class="lang-selector-row">
      <!-- Source Language Tabs -->
      <div class="lang-tabs-group source-group">
        <button
          class="lang-tab-btn"
          :class="{ active: sourceMode === 'detect' }"
          @click="selectSource('detect')"
        >
          <span v-if="sourceMode === 'detect' && sourceText.trim()">
            {{ detectedLang === 'joe' ? 'Joeglish' : 'English' }} - detected
          </span>
          <span v-else>
            Detect language
          </span>
        </button>

        <button
          class="lang-tab-btn"
          :class="{ active: sourceMode === 'en' }"
          @click="selectSource('en')"
        >
          English
        </button>

        <button
          class="lang-tab-btn"
          :class="{ active: sourceMode === 'joe' }"
          @click="selectSource('joe')"
        >
          Joeglish
        </button>

        <button class="chevron-btn" title="More languages">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>

      <!-- Swap Languages Button in Center -->
      <button
        class="swap-circle-btn"
        title="Swap languages"
        aria-label="Swap languages"
        @click="handleSwap"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="#5f6368"
          :class="{ 'rotate-anim': isSwapAnimating }"
        >
          <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
        </svg>
      </button>

      <!-- Target Language Tabs -->
      <div class="lang-tabs-group target-group">
        <button
          class="lang-tab-btn"
          :class="{ active: targetLang === 'joe' }"
          @click="selectTarget('joe')"
        >
          Joeglish
        </button>

        <button
          class="lang-tab-btn"
          :class="{ active: targetLang === 'en' }"
          @click="selectTarget('en')"
        >
          English
        </button>

        <button class="chevron-btn" title="More languages">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dual Translation Cards matching screenshot exactly -->
    <div class="translation-cards-row">
      <!-- Left Card: Source Box (White, rounded, border #dadce0) -->
      <div class="card source-card">
        <div class="card-body">
          <textarea
            v-model="sourceText"
            class="source-textarea"
            placeholder=""
            spellcheck="false"
            autofocus
          ></textarea>

          <button
            v-if="sourceText.length > 0"
            class="clear-input-btn"
            title="Clear text"
            aria-label="Clear text"
            @click="clearSource"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="card-footer source-footer">
          <!-- Microphone Icon on bottom left matching screenshot -->
          <button
            class="circle-action-icon"
            :class="{ listening: isListening }"
            title="Translate by voice"
            aria-label="Translate by voice"
            @click="toggleVoiceInput"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#5f6368">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>

          <!-- Pencil / Edit input tools on bottom right matching screenshot -->
          <div class="source-bottom-right">
            <span v-if="sourceText.length > 0" class="char-count">
              {{ sourceText.length.toLocaleString() }} / 5,000
            </span>
            <button class="circle-action-icon" title="Input tools">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Card: Target Box (Soft light-blue background #f0f4f9, rounded) -->
      <div class="card target-card">
        <div class="card-body">
          <div
            v-if="translationResult.translatedText"
            class="target-text-display"
          >
            {{ translationResult.translatedText }}
          </div>
          <div v-else class="target-placeholder">
            Translation
          </div>
        </div>

        <div class="card-footer target-footer">
          <div v-if="translationResult.translatedText" class="target-actions">
            <!-- Listen icon -->
            <button
              class="circle-action-icon"
              title="Listen"
              aria-label="Listen"
              @click="speakText(translationResult.translatedText)"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#5f6368">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>

            <!-- Copy icon -->
            <button
              class="circle-action-icon copy-btn"
              title="Copy translation"
              aria-label="Copy translation"
              @click="copyTranslation"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              <span v-if="copyTooltip" class="copied-tooltip">Translation copied</span>
            </button>

            <!-- Star / Save icon -->
            <button
              class="circle-action-icon"
              :class="{ starred: currentIsStarred }"
              title="Save translation"
              aria-label="Save translation"
              @click="emit('toggle-star-current')"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </button>

            <!-- Thumbs up -->
            <button
              class="circle-action-icon"
              :class="{ active: isLiked }"
              title="Rate this translation"
              @click="isLiked = !isLiked; isDisliked = false"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
            </button>

            <!-- Thumbs down -->
            <button
              class="circle-action-icon"
              :class="{ active: isDisliked }"
              title="Rate this translation"
              @click="isDisliked = !isDisliked; isLiked = false"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
              </svg>
            </button>

            <!-- Share icon -->
            <button
              class="circle-action-icon"
              title="Share translation"
              @click="handleShare"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#5f6368">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Small "Send feedback" link below the right card matching screenshot -->
    <div class="feedback-row">
      <a href="#" class="feedback-link" @click.prevent>Send feedback</a>
    </div>

    <!-- Centered Circular Buttons: (History) and (Saved) matching screenshot -->
    <div class="gt-bottom-circles">
      <!-- History Button -->
      <div class="circle-btn-item" @click="emit('open-drawer', 'history')">
        <button class="big-circle-button" title="History" aria-label="History">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#444746">
            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        </button>
        <span class="circle-btn-label">History</span>
      </div>

      <!-- Saved Button -->
      <div class="circle-btn-item" @click="emit('open-drawer', 'saved')">
        <button class="big-circle-button" title="Saved" aria-label="Saved">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#444746">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </button>
        <span class="circle-btn-label">Saved</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translate-page-container {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  flex-direction: column;
}

/* Language Selection Row */
.lang-selector-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.lang-tabs-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.source-group {
  justify-content: flex-start;
}

.target-group {
  justify-content: flex-start;
}

.lang-tab-btn {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #5f6368;
  border-bottom: 3px solid transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.lang-tab-btn:hover {
  color: #0b57d0;
}

.lang-tab-btn.active {
  color: #0b57d0;
  border-bottom-color: #0b57d0;
}

.chevron-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
}

.chevron-btn:hover {
  background: #f1f3f4;
}

.swap-circle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
  margin: 0 16px;
  transition: background 0.15s ease;
}

.swap-circle-btn:hover {
  background: #f1f3f4;
  color: #202124;
}

.rotate-anim {
  animation: spin 0.3s ease-in-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

/* Dual Cards Row matching screenshot */
.translation-cards-row {
  display: flex;
  gap: 16px;
  min-height: 220px;
}

.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  min-height: 200px;
  position: relative;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Left Card: Source Box (White, rounded, border #dadce0) */
.source-card {
  background: #ffffff;
  border: 1px solid #dadce0;
}

.source-card:focus-within {
  border-color: #0b57d0;
  box-shadow: 0 1px 3px rgba(11, 87, 208, 0.2);
}

/* Right Card: Target Box (Light bluish gray #f0f4f9) */
.target-card {
  background: #f0f4f9;
  border: 1px solid transparent;
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  position: relative;
  display: flex;
}

.source-textarea {
  width: 100%;
  height: 100%;
  font-size: 22px;
  line-height: 1.5;
  color: #1f1f1f;
  background: transparent;
}

.clear-input-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-input-btn:hover {
  background: #f1f3f4;
}

.target-text-display {
  width: 100%;
  height: 100%;
  font-size: 22px;
  line-height: 1.5;
  color: #1f1f1f;
  white-space: pre-wrap;
  word-break: break-word;
}

.target-placeholder {
  font-size: 22px;
  color: #747775;
}

.card-footer {
  padding: 10px 16px;
  display: flex;
  align-items: center;
}

.source-footer {
  justify-content: space-between;
}

.source-bottom-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-count {
  font-size: 12px;
  color: #747775;
}

.target-footer {
  justify-content: flex-end;
}

.target-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.circle-action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
  position: relative;
  transition: all 0.15s ease;
}

.circle-action-icon:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1f1f1f;
}

.circle-action-icon.starred {
  color: #fbbc04;
}

.circle-action-icon.active {
  color: #0b57d0;
}

.circle-action-icon.listening {
  color: #ea4335;
  background: #fce8e6;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.copy-btn {
  position: relative;
}

.copied-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #323232;
  color: #fff;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

/* Small "Send feedback" link matching screenshot */
.feedback-row {
  display: flex;
  justify-content: flex-end;
  padding: 8px 8px 0;
}

.feedback-link {
  font-size: 11px;
  color: #747775;
  text-decoration: none;
}

.feedback-link:hover {
  text-decoration: underline;
}

/* Centered Circular Buttons (History and Saved) matching screenshot */
.gt-bottom-circles {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 56px;
  margin-top: 48px;
}

.circle-btn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.big-circle-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid #dadce0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.circle-btn-item:hover .big-circle-button {
  background: #f8fafd;
  border-color: #0b57d0;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.15);
}

.circle-btn-label {
  font-size: 13px;
  font-weight: 500;
  color: #444746;
  transition: color 0.15s ease;
}

.circle-btn-item:hover .circle-btn-label {
  color: #0b57d0;
}

@media (max-width: 860px) {
  .translation-cards-row {
    flex-direction: column;
  }
  .gt-bottom-circles {
    margin-top: 32px;
    gap: 36px;
  }
}
</style>
