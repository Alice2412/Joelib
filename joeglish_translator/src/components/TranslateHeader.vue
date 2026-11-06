<script setup lang="ts">
// Real Google Translate header
</script>

<template>
  <header class="gt-header">
    <div class="gt-header-top">
      <div class="gt-header-left">
        <button class="gt-icon-btn" title="Main menu" aria-label="Main menu">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>

        <!-- Joegle Translate Logo in Google Logo Colors -->
        <div class="gt-logo-wrapper">
          <div class="gt-google-logo">
            <span class="j-blue">J</span>
            <span class="j-red">o</span>
            <span class="j-yellow">e</span>
            <span class="j-blue">g</span>
            <span class="j-green">l</span>
            <span class="j-red">e</span>
          </div>
          <span class="gt-logo-sub">Translate</span>
        </div>
      </div>

      <div class="gt-header-right">
        <button class="gt-icon-btn" title="Send feedback" aria-label="Send feedback">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
          </svg>
        </button>

        <button class="gt-icon-btn" title="Settings" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>

        <button class="gt-icon-btn" title="Google apps" aria-label="Google apps">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>

        <div class="gt-avatar" title="Google Account: Joe">
          <span>J</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs matching Google Translate exactly -->
    <nav class="gt-nav-tabs">
      <button class="gt-tab active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="tab-icon">
          <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        Text
      </button>

      <button class="gt-tab">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="tab-icon">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        Images
      </button>

      <button class="gt-tab">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="tab-icon">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        Documents
      </button>

      <button class="gt-tab">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="tab-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        Websites
      </button>
    </nav>
  </header>
</template>

<style scoped>
.gt-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 8px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gt-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
}

.gt-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gt-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background-color 0.15s ease;
}

.gt-icon-btn:hover {
  background-color: rgba(60, 64, 67, 0.08);
  color: var(--text-primary);
}

.gt-logo-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  cursor: pointer;
}

.gt-google-logo {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.5px;
  line-height: 1;
}

.j-blue { color: #4285f4; }
.j-red { color: #ea4335; }
.j-yellow { color: #fbbc05; }
.j-green { color: #34a853; }

.gt-logo-sub {
  font-size: 20px;
  color: var(--text-secondary);
  font-weight: 400;
  letter-spacing: -0.2px;
}

.gt-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gt-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a73e8;
  color: #fff;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 4px;
}

.gt-nav-tabs {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.gt-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.gt-tab:hover {
  color: var(--google-blue);
}

.gt-tab.active {
  color: var(--google-blue);
  border-bottom-color: var(--google-blue);
}

.tab-icon {
  flex-shrink: 0;
}
</style>
