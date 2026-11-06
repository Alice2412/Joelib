import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execFileSync } from 'node:child_process'

function joeglishDictionaryPlugin(): Plugin {
  return {
    name: 'joeglish-dictionary-generator',
    buildStart() {
      try {
        execFileSync('node', ['scripts/generateDictionary.js'], { stdio: 'inherit' });
      } catch (err) {
        console.error('Failed to generate Joeglish dictionary during buildStart', err);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), joeglishDictionaryPlugin()],
})
