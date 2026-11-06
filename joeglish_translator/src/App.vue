<script setup lang="ts">
import TranslateHeader from './components/TranslateHeader.vue';
import TranslateBox from './components/TranslateBox.vue';
</script>

<template>
  <div class="app-layout">
    <!-- Google Translate Style Header -->
    <TranslateHeader />

    <!-- Main Translate Workspace -->
    <main class="main-content">
      <TranslateBox />
    </main>

    <!-- Google Translate Style Minimal Footer -->
    <footer class="gt-footer">
      <div class="footer-left">
        <a href="#" class="footer-link">Send feedback</a>
      </div>
      <div class="footer-right">
        <a href="#" class="footer-link">Privacy &amp; Terms</a>
        <a href="#" class="footer-link">About Joegle Translate</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
}

.gt-footer {
  border-top: 1px solid var(--color-border);
  padding: 12px 24px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
}

.footer-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}
</style>
