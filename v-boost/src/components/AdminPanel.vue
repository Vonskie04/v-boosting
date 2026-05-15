<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#0f213c]/45 backdrop-blur-sm px-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-xl bg-white/90 border border-[#d8e2f2] rounded-3xl shadow-[0_24px_80px_rgba(13,37,74,0.24)] overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[#e2eaf6] bg-linear-to-r from-white to-[#f4f8ff]">
        <div>
          <h2 class="text-base font-semibold text-[#1d2d46]">Active Devices</h2>
          <p class="text-xs text-[#6a7f9f] mt-0.5">{{ sessions.length }} / {{ maxDevices }} slots used</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-[#607592] hover:text-[#2a3d5c] p-1.5 rounded-lg hover:bg-[#eaf0fb] transition-colors leading-none"
        >
          ✕
        </button>
      </div>

      <!-- Device limit control -->
      <div class="px-6 py-3 bg-[#f7faff] border-b border-[#e2eaf6] flex flex-wrap items-center gap-3">
        <span class="text-sm text-[#475d7f] font-medium">Device limit:</span>
        <input
          v-model.number="newLimit"
          type="number"
          min="1"
          max="100"
          class="w-16 rounded-lg border border-[#cfdcee] px-2 py-1.5 text-sm text-center text-[#20304b] bg-white focus:outline-none focus:ring-4 focus:ring-[#3c77d8]/15 focus:border-[#3c77d8]"
        />
        <button
          @click="updateLimit"
          class="text-sm text-white font-semibold bg-[#155fc8] hover:bg-[#114ea5] px-3 py-1.5 rounded-lg transition-colors"
        >
          Apply
        </button>
        <span v-if="limitMsg" class="text-xs text-emerald-700 font-medium">{{ limitMsg }}</span>
      </div>

      <!-- Sessions list -->
      <div class="max-h-80 overflow-y-auto divide-y divide-[#eef3fb]">
        <div v-if="loading" class="text-center text-sm text-[#6a7f9f] py-8">Loading...</div>
        <div
          v-else-if="sessions.length === 0"
          class="text-center text-sm text-[#6a7f9f] py-8"
        >
          No active sessions.
        </div>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex items-center justify-between gap-4 px-6 py-3.5 bg-white"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-[#20314d] truncate">
                {{ deviceLabel(session.deviceInfo) }}
              </span>
              <span
                v-if="session.id === currentToken"
                class="shrink-0 text-xs bg-[#155fc8] text-white px-2 py-0.5 rounded-full"
              >
                you
              </span>
            </div>
            <p class="text-xs text-[#6a7f9f] mt-0.5 truncate">
              {{ session.ipAddress }} &bull; Connected {{ timeAgo(session.createdAt) }}
            </p>
            <p class="text-xs text-[#6a7f9f]">Last seen {{ timeAgo(session.lastSeen) }}</p>
          </div>

          <button
            v-if="session.id !== currentToken"
            @click="disconnect(session.id)"
            class="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Disconnect
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-[#e2eaf6] bg-[#f9fbff] flex justify-between items-center gap-3">
        <span class="text-xs text-[#6a7f9f]">Auto-refreshes every 10s</span>
        <button
          @click="disconnectAll"
          :disabled="sessions.filter(s => s.id !== currentToken).length === 0"
          class="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
