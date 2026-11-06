<script setup lang="ts">
// Real Google Translate Header Mock
</script>

<template>
  <header class="gt-header">
    <div class="gt-header-left">
      <button class="gt-icon-btn" title="Main menu" aria-label="Main menu">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#5f6368">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      <!-- Joegle Translate Logo -->
      <a href="/" class="gt-logo-link" title="Joegle Translate">
        <div class="gt-google-logo">
          <span class="j-blue">J</span>
          <span class="j-red">o</span>
          <span class="j-yellow">e</span>
          <span class="j-blue">g</span>
          <span class="j-green">l</span>
          <span class="j-red">e</span>
        </div>
        <span class="gt-logo-sub">Translate</span>
      </a>
    </div>

    <div class="gt-header-right">
      <!-- Theme toggle icon (Sun) matching screenshot -->
      <button class="gt-icon-btn" title="Turn on dark theme" aria-label="Toggle theme">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#5f6368">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
        </svg>
      </button>

      <!-- Settings gear icon -->
      <button class="gt-icon-btn" title="Settings" aria-label="Settings">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#5f6368">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>

      <!-- Google apps 9-dot icon -->
      <button class="gt-icon-btn" title="Google apps" aria-label="Google apps">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#5f6368">
          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      <!-- Blue Sign in Pill Button matching screenshot -->
      <button class="gt-signin-btn">
        Sign in
      </button>
    </div>
  </header>
</template>

<style scoped>
.gt-header {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-bottom: 1px solid transparent;
  user-select: none;
}

.gt-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gt-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
  transition: background-color 0.15s ease;
}

.gt-icon-btn:hover {
  background-color: rgba(60, 64, 67, 0.08);
  color: #202124;
}

.gt-logo-link {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  cursor: pointer;
  padding: 0 4px;
}

.gt-google-logo {
  font-family: 'Google Sans', Roboto, sans-serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.5px;
  line-height: 24px;
  display: flex;
  align-items: baseline;
}

.j-blue { color: #4285f4; }
.j-red { color: #ea4335; }
.j-yellow { color: #fbbc05; }
.j-green { color: #34a853; }

.gt-logo-sub {
  font-family: 'Google Sans', 'Google Sans Text', Roboto, Arial, sans-serif;
  font-size: 22px;
  color: #5f6368;
  font-weight: 400;
  letter-spacing: -0.2px;
  line-height: 24px;
  margin-left: 2px;
}

.gt-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gt-signin-btn {
  background-color: #0b57d0;
  color: #ffffff;
  font-family: 'Google Sans', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.25px;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.gt-signin-btn:hover {
  background-color: #0842a0;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

@media (max-width: 600px) {
  .gt-header {
    padding: 0 8px;
  }
  .gt-signin-btn {
    padding: 0 16px;
  }
}
</style>
