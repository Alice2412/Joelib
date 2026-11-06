<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TranslateHeader from './components/TranslateHeader.vue';
import TranslateBox from './components/TranslateBox.vue';
import HistoryDrawer from './components/HistoryDrawer.vue';
import type { TranslationHistoryItem, TranslationDirection } from './engine/types.ts';

const translateBoxRef = ref<any>(null);
const historyItems = ref<TranslationHistoryItem[]>([]);
const isDrawerOpen = ref<boolean>(false);
const activeDrawerTab = ref<'history' | 'saved'>('history');

onMounted(() => {
  try {
    const saved = localStorage.getItem('joegle_translate_history');
    if (saved) {
      historyItems.value = JSON.parse(saved);
    }
  } catch {
    // ignore localStorage errors
  }
});

function persistHistory() {
  try {
    localStorage.setItem('joegle_translate_history', JSON.stringify(historyItems.value));
  } catch {
    // ignore
  }
}

function handleSaveTranslation(item: { source: string; target: string; direction: TranslationDirection }) {
  if (!item.source.trim() || !item.target.trim()) return;

  const existingIdx = historyItems.value.findIndex(
    h => h.sourceText.trim() === item.source.trim() && h.direction === item.direction
  );

  if (existingIdx !== -1) {
    historyItems.value[existingIdx].targetText = item.target;
    historyItems.value[existingIdx].timestamp = Date.now();
  } else {
    const newItem: TranslationHistoryItem = {
      id: Math.random().toString(36).slice(2, 9),
      sourceText: item.source,
      targetText: item.target,
      direction: item.direction,
      timestamp: Date.now(),
      favorite: false
    };
    historyItems.value.unshift(newItem);
    if (historyItems.value.length > 100) {
      historyItems.value = historyItems.value.slice(0, 100);
    }
  }
  persistHistory();
}

function handleToggleStarCurrent() {
  if (historyItems.value.length > 0) {
    historyItems.value[0].favorite = !historyItems.value[0].favorite;
    persistHistory();
  }
}

function handleToggleStar(id: string) {
  const item = historyItems.value.find(h => h.id === id);
  if (item) {
    item.favorite = !item.favorite;
    persistHistory();
  }
}

function handleDeleteItem(id: string) {
  historyItems.value = historyItems.value.filter(h => h.id !== id);
  persistHistory();
}

function handleClearAll() {
  if (activeDrawerTab.value === 'saved') {
    historyItems.value.forEach(h => { h.favorite = false; });
  } else {
    historyItems.value = [];
  }
  persistHistory();
}

function handleOpenDrawer(tab: 'history' | 'saved') {
  activeDrawerTab.value = tab;
  isDrawerOpen.value = true;
}

function handleCloseDrawer() {
  isDrawerOpen.value = false;
}

function handleSelectItem(item: TranslationHistoryItem) {
  if (translateBoxRef.value?.loadHistoryItem) {
    translateBoxRef.value.loadHistoryItem(item);
  }
  isDrawerOpen.value = false;
}
</script>

<template>
  <div class="app-layout">
    <!-- Header matching screenshot -->
    <TranslateHeader />

    <!-- Main Workspace -->
    <main class="main-content">
      <TranslateBox
        ref="translateBoxRef"
        :history-items="historyItems"
        @open-drawer="handleOpenDrawer"
        @save-translation="handleSaveTranslation"
        @toggle-star-current="handleToggleStarCurrent"
      />
    </main>

    <!-- History / Saved Sliding Panel Drawer -->
    <HistoryDrawer
      :is-open="isDrawerOpen"
      :active-tab="activeDrawerTab"
      :items="historyItems"
      @close="handleCloseDrawer"
      @change-tab="t => activeDrawerTab = t"
      @select-item="handleSelectItem"
      @toggle-star="handleToggleStar"
      @delete-item="handleDeleteItem"
      @clear-all="handleClearAll"
    />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 40px;
}
</style>
