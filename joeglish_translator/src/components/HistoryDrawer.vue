<script setup lang="ts">
import { computed } from 'vue';
import type { TranslationHistoryItem } from '../engine/types.ts';

const props = defineProps<{
  isOpen: boolean;
  activeTab: 'history' | 'saved';
  items: TranslationHistoryItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'change-tab', tab: 'history' | 'saved'): void;
  (e: 'select-item', item: TranslationHistoryItem): void;
  (e: 'toggle-star', id: string): void;
  (e: 'delete-item', id: string): void;
  (e: 'clear-all'): void;
}>();

const displayItems = computed(() => {
  if (props.activeTab === 'saved') {
    return props.items.filter(i => i.favorite);
  }
  return props.items;
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div v-if="isOpen" class="drawer-overlay" @click.self="emit('close')">
    <aside class="drawer-container">
      <!-- Drawer Header -->
      <div class="drawer-header">
        <div class="header-left">
          <button class="drawer-icon-btn" title="Close" @click="emit('close')">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <div class="tab-toggles">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'history' }"
              @click="emit('change-tab', 'history')"
            >
              History
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'saved' }"
              @click="emit('change-tab', 'saved')"
            >
              Saved
            </button>
          </div>
        </div>

        <button
          v-if="displayItems.length > 0"
          class="clear-all-btn"
          title="Clear all"
          @click="emit('clear-all')"
        >
          Clear all
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="drawer-content">
        <div v-if="displayItems.length === 0" class="empty-state">
          <div class="empty-icon-circle">
            <svg v-if="activeTab === 'history'" viewBox="0 0 24 24" width="40" height="40" fill="#747775">
              <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="40" height="40" fill="#747775">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          <div class="empty-title">
            {{ activeTab === 'saved' ? 'No saved translations' : 'Translation history is empty' }}
          </div>
          <div class="empty-desc">
            {{ activeTab === 'saved' ? 'Click the star icon on any translation to save it here.' : 'Translations you perform will appear here.' }}
          </div>
        </div>

        <div v-else class="items-list">
          <div
            v-for="item in displayItems"
            :key="item.id"
            class="history-card"
            @click="emit('select-item', item)"
          >
            <div class="card-meta">
              <span class="meta-dir">
                {{ item.direction === 'en-to-joe' ? 'English → Joeglish' : 'Joeglish → English' }}
              </span>
              <span class="meta-time">{{ formatTime(item.timestamp) }}</span>
            </div>

            <div class="card-source">{{ item.sourceText }}</div>
            <div class="card-target">{{ item.targetText }}</div>

            <div class="card-footer" @click.stop>
              <button
                class="card-action-btn"
                :class="{ starred: item.favorite }"
                title="Star translation"
                @click="emit('toggle-star', item.id)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </button>

              <button
                class="card-action-btn"
                title="Delete"
                @click="emit('delete-item', item.id)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

.drawer-container {
  width: 100%;
  max-width: 440px;
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
  animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e2e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
}

.drawer-icon-btn:hover {
  background: #f1f3f4;
  color: #202124;
}

.tab-toggles {
  display: flex;
  gap: 6px;
}

.tab-btn {
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #5f6368;
  border-radius: 18px;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: #f1f3f4;
}

.tab-btn.active {
  color: #0b57d0;
  background: #c2e7ff;
}

.clear-all-btn {
  font-size: 13px;
  color: #0b57d0;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 4px;
}

.clear-all-btn:hover {
  background: #f0f4f9;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80%;
  text-align: center;
  gap: 12px;
  padding: 32px 20px;
}

.empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f0f4f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
}

.empty-desc {
  font-size: 13px;
  color: #747775;
  max-width: 260px;
  line-height: 1.4;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  padding: 14px 16px;
  border: 1px solid #dadce0;
  border-radius: 12px;
  cursor: pointer;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;
}

.history-card:hover {
  border-color: #0b57d0;
  box-shadow: 0 1px 3px rgba(60,64,67,0.15);
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.meta-dir {
  color: #0b57d0;
  font-weight: 500;
}

.meta-time {
  color: #747775;
}

.card-source {
  font-size: 14px;
  color: #1f1f1f;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-target {
  font-size: 14px;
  color: #0b57d0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.card-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #747775;
}

.card-action-btn:hover {
  background: #f1f3f4;
  color: #1f1f1f;
}

.card-action-btn.starred {
  color: #fbbc04;
}
</style>
