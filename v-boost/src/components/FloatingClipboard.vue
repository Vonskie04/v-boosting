<template>
  <div
    v-if="isVisible"
    class="pointer-events-none fixed z-50 w-[min(92vw,340px)]"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div
      ref="panelRef"
      class="pointer-events-auto overflow-hidden rounded-2xl border bg-white/35 shadow-[0_12px_40px_rgba(17,48,92,0.22)] backdrop-blur-xl transition-colors"
      :class="isDragging ? 'border-[#1f3f6d]/80' : 'border-white/45'"
    >
      <div
        class="flex items-center justify-between border-b border-white/45 px-3 py-2 select-none touch-none"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @mousedown="startDrag"
        @touchstart.prevent="startTouchDrag"
      >
        <button
          class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f4569]"
          type="button"
          @click="toggleOpen"
        >
          Floating Clipboard
        </button>
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg border border-white/55 bg-white/45 px-2 py-1 text-xs font-medium text-[#2f4569] hover:bg-white/70"
            type="button"
            data-no-drag
            @mousedown.stop
            @touchstart.stop
            @click="clearText"
          >
            Clear
          </button>
          <button
            class="rounded-lg border border-white/55 bg-white/45 px-2 py-1 text-xs font-medium text-[#2f4569] hover:bg-white/70"
            type="button"
            aria-label="Close floating clipboard"
            data-no-drag
            @mousedown.stop
            @touchstart.stop
            @click="closeWidget"
          >
            Close
          </button>
        </div>
      </div>

      <div v-show="isOpen" class="space-y-2 p-3">
        <textarea
          ref="textareaRef"
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

  <button
    v-else
    class="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/45 p-2.5 text-[#2f4569] shadow-[0_10px_30px_rgba(17,48,92,0.2)] backdrop-blur-xl hover:bg-white/65"
    type="button"
    aria-label="Open floating clipboard"
    title="Open floating clipboard"
    @click="openWidget"
  >
    <ClipboardList :size="18" class="shrink-0" aria-hidden="true" />
  </button>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ClipboardList } from '@lucide/vue'

const STORAGE_KEY_TEXT = 'vboost_floating_clipboard_text'
const STORAGE_KEY_POSITION = 'vboost_floating_clipboard_position'
const STORAGE_KEY_OPEN = 'vboost_floating_clipboard_open'
const STORAGE_KEY_VISIBLE = 'vboost_floating_clipboard_visible'
const NON_DRAGGABLE_SELECTOR = 'input, textarea, select, a, [data-no-drag]'

const text = ref('')
const copied = ref(false)
const isOpen = ref(true)
const status = ref('')
const isVisible = ref(true)
const isDragging = ref(false)
const panelRef = ref(null)
const textareaRef = ref(null)
const position = ref({ x: 16, y: 120 })

const dragState = {
  active: false,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
  moved: false,
  suppressNextClick: false,
}

let copiedTimer
let statusTimer

function clampPosition(nextX, nextY) {
  const panelWidth = panelRef.value?.offsetWidth ?? 340
  const panelHeight = panelRef.value?.offsetHeight ?? 240
  const maxX = Math.max(8, window.innerWidth - panelWidth - 8)
  const maxY = Math.max(8, window.innerHeight - panelHeight - 8)

  return {
    x: Math.min(Math.max(8, nextX), maxX),
    y: Math.min(Math.max(8, nextY), maxY),
  }
}

function setStatus(message) {
  status.value = message
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    status.value = ''
  }, 3000)
}

function startDragFromPoint(clientX, clientY) {
  dragState.active = true
  isDragging.value = true
  dragState.offsetX = clientX - position.value.x
  dragState.offsetY = clientY - position.value.y
  dragState.startX = clientX
  dragState.startY = clientY
  dragState.moved = false
}

function canStartDragFromTarget(target) {
  return target instanceof Element && !target.closest(NON_DRAGGABLE_SELECTOR)
}

function startDrag(e) {
  if (!canStartDragFromTarget(e.target)) {
    return
  }

  startDragFromPoint(e.clientX, e.clientY)
}

function startTouchDrag(e) {
  if (e.touches.length !== 1) return
  if (!canStartDragFromTarget(e.target)) return

  const point = e.touches[0]
  startDragFromPoint(point.clientX, point.clientY)

  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onDragEnd)
  window.addEventListener('touchcancel', onDragEnd)
}

function updateDragPosition(clientX, clientY) {
  if (!dragState.active) return

  if (Math.abs(clientX - dragState.startX) > 3 || Math.abs(clientY - dragState.startY) > 3) {
    dragState.moved = true
  }

  const next = clampPosition(
    clientX - dragState.offsetX,
    clientY - dragState.offsetY,
  )
  position.value = next
}

function onMouseMove(e) {
  updateDragPosition(e.clientX, e.clientY)
}

function onTouchMove(e) {
  if (!dragState.active || e.touches.length === 0) return
  e.preventDefault()
  updateDragPosition(e.touches[0].clientX, e.touches[0].clientY)
}

function onDragEnd() {
  if (dragState.active && dragState.moved) {
    dragState.suppressNextClick = true
  }
  dragState.active = false
  isDragging.value = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onDragEnd)
  window.removeEventListener('touchcancel', onDragEnd)
}

function toggleOpen() {
  if (dragState.suppressNextClick) {
    dragState.suppressNextClick = false
    return
  }
  isOpen.value = !isOpen.value
}

function closeWidget() {
  isVisible.value = false
}

function openWidget() {
  isVisible.value = true
}

function getSelectedClipboardText() {
  const textarea = textareaRef.value
  if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
    return text.value.slice(textarea.selectionStart, textarea.selectionEnd)
  }

  const selection = window.getSelection?.()
  const selectedText = selection?.toString() ?? ''
  return selectedText.trim() ? selectedText : text.value
}

async function copyText() {
  if (!navigator.clipboard) {
    setStatus('Clipboard not available in this browser context.')
    return
  }

  const textToCopy = getSelectedClipboardText()

  try {
    await navigator.clipboard.writeText(textToCopy)
    localStorage.setItem(STORAGE_KEY_TEXT, text.value)
    copied.value = true
    setStatus(textToCopy === text.value ? 'Copied to clipboard.' : 'Copied selection.')

    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    setStatus('Unable to copy. Check browser permissions.')
  }
}

async function pasteText() {
  if (!navigator.clipboard) {
    setStatus('Clipboard not available in this browser context.')
    return
  }

  try {
    text.value = await navigator.clipboard.readText()
    setStatus('Pasted from clipboard.')
  } catch {
    setStatus('Unable to paste. Check browser permissions.')
  }
}

function clearText() {
  text.value = ''
  copied.value = false
  setStatus('Cleared.')
}

function loadStoredState() {
  const savedText = localStorage.getItem(STORAGE_KEY_TEXT)
  if (savedText !== null) {
    text.value = savedText
  }

  const savedOpen = localStorage.getItem(STORAGE_KEY_OPEN)
  if (savedOpen === 'true' || savedOpen === 'false') {
    isOpen.value = savedOpen === 'true'
  }

  const savedVisible = localStorage.getItem(STORAGE_KEY_VISIBLE)
  if (savedVisible === 'true' || savedVisible === 'false') {
    isVisible.value = savedVisible === 'true'
  }

  const savedPosition = localStorage.getItem(STORAGE_KEY_POSITION)
  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition)
      if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
        position.value = parsed
      }
    } catch {
      // Ignore malformed localStorage data.
    }
  }
}

function onResize() {
  position.value = clampPosition(position.value.x, position.value.y)
}

watch(text, (value) => {
  localStorage.setItem(STORAGE_KEY_TEXT, value)
})

watch(isOpen, (value) => {
  localStorage.setItem(STORAGE_KEY_OPEN, String(value))
})

watch(isVisible, (value) => {
  localStorage.setItem(STORAGE_KEY_VISIBLE, String(value))
})

watch(position, (value) => {
  localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(value))
}, { deep: true })

onMounted(() => {
  loadStoredState()
  position.value = clampPosition(position.value.x, position.value.y)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  clearTimeout(copiedTimer)
  clearTimeout(statusTimer)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onDragEnd)
  window.removeEventListener('touchcancel', onDragEnd)
  window.removeEventListener('resize', onResize)
})
</script>
