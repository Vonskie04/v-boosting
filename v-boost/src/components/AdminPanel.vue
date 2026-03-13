<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Active Devices</h2>
          <p class="text-xs text-gray-400 mt-0.5">{{ sessions.length }} / {{ maxDevices }} slots used</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors leading-none"
        >
          ✕
        </button>
      </div>

      <!-- Device limit control -->
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        <span class="text-sm text-gray-600">Device limit:</span>
        <input
          v-model.number="newLimit"
          type="number"
          min="1"
          max="100"
          class="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-800"
        />
        <button
          @click="updateLimit"
          class="text-sm text-gray-900 font-medium hover:underline"
        >
          Apply
        </button>
        <span v-if="limitMsg" class="text-xs text-green-600">{{ limitMsg }}</span>
      </div>

      <!-- Sessions list -->
      <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
        <div v-if="loading" class="text-center text-sm text-gray-400 py-8">Loading...</div>
        <div
          v-else-if="sessions.length === 0"
          class="text-center text-sm text-gray-400 py-8"
        >
          No active sessions.
        </div>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex items-center justify-between gap-4 px-6 py-3"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 truncate">
                {{ deviceLabel(session.deviceInfo) }}
              </span>
              <span
                v-if="session.id === currentToken"
                class="shrink-0 text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded-full"
              >
                you
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5 truncate">
              {{ session.ipAddress }} &bull; Connected {{ timeAgo(session.createdAt) }}
            </p>
            <p class="text-xs text-gray-400">Last seen {{ timeAgo(session.lastSeen) }}</p>
          </div>

          <button
            v-if="session.id !== currentToken"
            @click="disconnect(session.id)"
            class="shrink-0 text-xs font-medium text-red-600 hover:underline"
          >
            Disconnect
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
        <span class="text-xs text-gray-400">Auto-refreshes every 10s</span>
        <button
          @click="disconnectAll"
          :disabled="sessions.filter(s => s.id !== currentToken).length === 0"
          class="text-sm font-medium text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Disconnect all others
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { AUTH_FLAG } from '../router'

defineEmits(['close'])

const sessions = ref([])
const maxDevices = ref(10)
const newLimit = ref(10)
const loading = ref(true)
const limitMsg = ref('')

const currentToken = sessionStorage.getItem(AUTH_FLAG)

async function fetchSessions() {
  try {
    const res = await fetch('/api/admin/sessions', {
      headers: { Authorization: `Bearer ${currentToken}` },
    })
    if (!res.ok) return
    const data = await res.json()
    sessions.value = data.sessions
    maxDevices.value = data.maxDevices
    newLimit.value = data.maxDevices
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

async function disconnect(id) {
  await fetch(`/api/admin/sessions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${currentToken}` },
  })
  await fetchSessions()
}

async function disconnectAll() {
  await fetch('/api/admin/disconnect-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  })
  await fetchSessions()
}

async function updateLimit() {
  const res = await fetch('/api/admin/limit', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ limit: newLimit.value }),
  })
  if (res.ok) {
    await fetchSessions()
    limitMsg.value = 'Saved'
    setTimeout(() => { limitMsg.value = '' }, 2000)
  }
}

function deviceLabel(ua) {
  if (!ua) return 'Unknown device'
  let os = 'Desktop'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS'
  else if (/iPhone/i.test(ua)) os = 'iPhone'
  else if (/iPad/i.test(ua)) os = 'iPad'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'

  let browser = ''
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Safari/i.test(ua)) browser = 'Safari'

  return browser ? `${os} · ${browser}` : os
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

let pollInterval
onMounted(() => {
  fetchSessions()
  pollInterval = setInterval(fetchSessions, 10000)
})
onUnmounted(() => clearInterval(pollInterval))
</script>
