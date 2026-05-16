<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-50 w-[min(92vw,340px)]">
    <div class="pointer-events-auto overflow-hidden rounded-2xl border border-white/45 bg-white/35 shadow-[0_12px_40px_rgba(17,48,92,0.22)] backdrop-blur-xl">
      <div class="flex items-center justify-between border-b border-white/45 px-3 py-2">
        <button
          class="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f4569]"
          type="button"
          @click="isOpen = !isOpen"
        >
          Floating Clipboard
        </button>
        <button
          class="rounded-lg border border-white/55 bg-white/45 px-2 py-1 text-xs font-medium text-[#2f4569] hover:bg-white/70"
          type="button"
          @click="clearText"
        >
          Clear
        </button>
      </div>

      <div v-show="isOpen" class="space-y-2 p-3">
        <textarea
          v-model="text"
          class="h-28 w-full resize-y rounded-xl border border-white/55 bg-white/55 px-3 py-2 text-sm text-[#1b2a44] outline-none placeholder:text-[#5c7090] focus:ring-2 focus:ring-[#2a67c0]/45"
          placeholder="Quick notes, links, and snippets..."
        />

        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-[#c8d8f0] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#234066] hover:bg-white"
            type="button"
            @click="copyText"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
          <button
            class="rounded-lg border border-[#c8d8f0] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#234066] hover:bg-white"
            type="button"
            @click="pasteText"
          >
            Paste
          </button>
          <span class="truncate text-xs text-[#3f577a]" aria-live="polite">{{ status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'

const text = ref('')
const copied = ref(false)
const isOpen = ref(true)
const status = ref('')
let copiedTimer

async function copyText() {
  if (!navigator.clipboard) {
    status.value = 'Clipboard not available in this browser context.'
    return
  }

  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
    status.value = 'Copied to clipboard.'

    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    status.value = 'Unable to copy. Check browser permissions.'
  }
}

async function pasteText() {
  if (!navigator.clipboard) {
    status.value = 'Clipboard not available in this browser context.'
    return
  }

  try {
    text.value = await navigator.clipboard.readText()
    status.value = 'Pasted from clipboard.'
  } catch {
    status.value = 'Unable to paste. Check browser permissions.'
  }
}

function clearText() {
  text.value = ''
  copied.value = false
  status.value = 'Cleared.'
}

onUnmounted(() => {
  clearTimeout(copiedTimer)
})
</script>
