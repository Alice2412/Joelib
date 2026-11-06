<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { engine } from '../engine/joeglishEngine';
import type { TranslationDirection, TranslationResult } from '../engine/types';

const direction = ref<TranslationDirection>('en-to-joe');
const sourceText = ref<string>('');
const isSwapAnimating = ref<boolean>(false);
const copyTooltip = ref<boolean>(false);
const isListening = ref<boolean>(false);
const isSpeaking = ref<boolean>(false);
const isLiked = ref<boolean>(false);
const isDisliked = ref<boolean>(false);

const translationResult = ref<TranslationResult>({
  translatedText: '',
  mappings: [],
  roundTripText: '',
  isBijectiveRoundTrip: true
});

function performTranslation() {
  translationResult.value = engine.translate(sourceText.value, direction.value);
}

watch(sourceText, () => {
  performTranslation();
});

watch(direction, () => {
  performTranslation();
});

function handleSwap() {
  isSwapAnimating.value = true;
  setTimeout(() => {
    isSwapAnimating.value = false;
  }, 300);

  const prevTarget = translationResult.value.translatedText;
  direction.value = direction.value === 'en-to-joe' ? 'joe-to-en' : 'en-to-joe';
  sourceText.value = prevTarget;
}

function setDirection(newDir: TranslationDirection) {
  if (direction.value !== newDir) {
    direction.value = newDir;
  }
}

function clearSource() {
  sourceText.value = '';
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

  if (!SpeechRecognition) {
    return;
  }

  if (isListening.value) {
    isListening.value = false;
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening.value = true;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sourceText.value = (sourceText.value ? sourceText.value + ' ' : '') + transcript;
      isListening.value = false;
    };

    recognition.onerror = () => {
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };

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

const charCount = computed(() => sourceText.value.length);
</script>

<template>
  <div class="translate-box-container">
    <!-- Language Selector Bar (Identical to Google Translate) -->
    <div class="lang-selector-bar">
      <!-- Source Language Tabs -->
      <div class="lang-tabs source-tabs">
        <button
          class="lang-tab"
          :class="{ active: direction === 'en-to-joe' }"
          @click="setDirection('en-to-joe')"
        >
          English
        </button>
        <button
          class="lang-tab"
          :class="{ active: direction === 'joe-to-en' }"
          @click="setDirection('joe-to-en')"
        >
          Joeglish
        </button>
        <button class="lang-dropdown-btn" title="More languages">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      </div>

      <!-- Swap Languages Button -->
      <button
        class="swap-btn"
        title="Swap languages"
        aria-label="Swap languages"
        @click="handleSwap"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          :class="{ 'rotate-anim': isSwapAnimating }"
        >
          <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
        </svg>
      </button>

      <!-- Target Language Tabs -->
      <div class="lang-tabs target-tabs">
        <button
          class="lang-tab"
          :class="{ active: direction === 'en-to-joe' }"
          @click="setDirection('en-to-joe')"
        >
          Joeglish
        </button>
        <button
          class="lang-tab"
          :class="{ active: direction === 'joe-to-en' }"
          @click="setDirection('joe-to-en')"
        >
          English
        </button>
        <button class="lang-dropdown-btn" title="More languages">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dual Translation Card (Real Google Translate Layout) -->
    <div class="translation-card">
      <!-- Source Panel -->
      <div class="panel source-panel">
        <div class="panel-header">
          <span class="panel-lang-title">{{ direction === 'en-to-joe' ? 'English' : 'Joeglish' }}</span>
          <button
            v-if="sourceText.length > 0"
            class="clear-btn"
            title="Clear text"
            aria-label="Clear text"
            @click="clearSource"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="textarea-wrapper">
          <textarea
            v-model="sourceText"
            class="source-textarea"
            :class="{ 'text-large': sourceText.length < 80 }"
            placeholder=""
            spellcheck="false"
            autofocus
          ></textarea>
        </div>

        <div class="panel-footer">
          <div class="action-buttons">
            <button
              class="icon-action-btn"
              :class="{ active: isSpeaking }"
              title="Listen"
              aria-label="Listen"
              :disabled="!sourceText"
              @click="speakText(sourceText)"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>

            <button
              class="icon-action-btn"
              :class="{ listening: isListening }"
              title="Translate by voice"
              aria-label="Translate by voice"
              @click="toggleVoiceInput"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
          </div>

          <div class="char-counter">
            {{ charCount.toLocaleString() }} / 5,000
          </div>
        </div>
      </div>

      <!-- Target Panel -->
      <div class="panel target-panel">
        <div class="panel-header">
          <span class="panel-lang-title">{{ direction === 'en-to-joe' ? 'Joeglish' : 'English' }}</span>
        </div>

        <div class="textarea-wrapper">
          <div
            v-if="translationResult.translatedText"
            class="target-output"
            :class="{ 'text-large': translationResult.translatedText.length < 80 }"
          >
            {{ translationResult.translatedText }}
          </div>
          <div v-else class="target-placeholder">
            Translation
          </div>
        </div>

        <div class="panel-footer">
          <div class="action-buttons">
            <button
              class="icon-action-btn"
              title="Listen"
              aria-label="Listen"
              :disabled="!translationResult.translatedText"
              @click="speakText(translationResult.translatedText)"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>

            <button
              class="icon-action-btn copy-btn-wrap"
              title="Copy translation"
              aria-label="Copy translation"
              :disabled="!translationResult.translatedText"
              @click="copyTranslation"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              <span v-if="copyTooltip" class="tooltip-bubble">Translation copied</span>
            </button>

            <button
              class="icon-action-btn"
              :class="{ active: isLiked }"
              title="Good translation"
              aria-label="Rate this translation"
              :disabled="!translationResult.translatedText"
              @click="isLiked = !isLiked; isDisliked = false"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
            </button>

            <button
              class="icon-action-btn"
              :class="{ active: isDisliked }"
              title="Poor translation"
              aria-label="Rate this translation"
              :disabled="!translationResult.translatedText"
              @click="isDisliked = !isDisliked; isLiked = false"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
              </svg>
            </button>

            <button
              class="icon-action-btn"
              title="Share translation"
              aria-label="Share translation"
              :disabled="!translationResult.translatedText"
              @click="handleShare"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Google Translate Bottom Action Cards (History / Saved / Contribute) -->
    <div class="gt-bottom-actions">
      <button class="bottom-action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        History
      </button>

      <button class="bottom-action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        Saved
      </button>

      <button class="bottom-action-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
        Contribute
      </button>
    </div>
  </div>
</template>

<style scoped>
.translate-box-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
}

.lang-selector-bar {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-bottom: none;
  background: #fff;
  border-radius: 8px 8px 0 0;
  padding: 0 16px;
  min-height: 48px;
}

.lang-tabs {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-tabs {
  justify-content: flex-start;
}

.target-tabs {
  justify-content: flex-start;
}

.lang-tab {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 3px solid transparent;
  transition: all 0.15s ease;
}

.lang-tab:hover {
  color: var(--google-blue);
}

.lang-tab.active {
  color: var(--google-blue);
  border-bottom-color: var(--google-blue);
}

.lang-dropdown-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.lang-dropdown-btn:hover {
  background: #f1f3f4;
}

.swap-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background 0.15s ease;
  margin: 0 12px;
}

.swap-btn:hover {
  background: #f1f3f4;
  color: var(--text-primary);
}

.rotate-anim {
  animation: spin 0.3s ease-in-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

.translation-card {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 0 0 8px 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(60,64,67,0.12);
  min-height: 300px;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 280px;
}

.source-panel {
  border-right: 1px solid var(--color-border);
  background: #fff;
}

.target-panel {
  background: var(--color-panel-bg);
  border-radius: 0 0 8px 0;
}

.panel-header {
  padding: 12px 16px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-lang-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.clear-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.clear-btn:hover {
  background: #f1f3f4;
  color: var(--text-primary);
}

.textarea-wrapper {
  flex: 1;
  padding: 8px 16px;
  display: flex;
}

.source-textarea {
  width: 100%;
  height: 100%;
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-primary);
  background: transparent;
}

.source-textarea.text-large {
  font-size: 24px;
}

.target-output {
  width: 100%;
  height: 100%;
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.target-output.text-large {
  font-size: 24px;
}

.target-placeholder {
  font-size: 24px;
  color: var(--text-disabled);
}

.panel-footer {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-buttons {
  display: flex;
  gap: 8px;
  position: relative;
}

.icon-action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.icon-action-btn:hover:not(:disabled) {
  background: #f1f3f4;
  color: var(--text-primary);
}

.icon-action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.icon-action-btn.active {
  color: var(--google-blue);
}

.icon-action-btn.listening {
  color: #ea4335;
  background: #fce8e6;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.copy-btn-wrap {
  position: relative;
}

.tooltip-bubble {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: #323232;
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  animation: fadeIn 0.15s ease;
  pointer-events: none;
}

.char-counter {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Real Google Translate Bottom Actions (History, Saved, Contribute) */
.gt-bottom-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.bottom-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: #fff;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.bottom-action-btn:hover {
  background: #f1f3f4;
  border-color: #bdc1c6;
  box-shadow: 0 1px 2px rgba(60,64,67,0.15);
}

@media (max-width: 768px) {
  .translation-card {
    flex-direction: column;
  }
  .source-panel {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
  .target-panel {
    border-radius: 0 0 8px 8px;
  }
}
</style>
