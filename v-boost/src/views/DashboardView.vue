<template>
  <div class="min-h-screen w-full flex flex-col">
    <nav class="sticky top-0 z-40 w-full border-b border-[#d8e2f2] bg-white/70 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-[#667997] font-semibold">Control Center</p>
          <h1 class="text-lg sm:text-xl font-semibold text-[#1a2740]">v-boost Dashboard</h1>
        </div>

        <div class="sm:ml-auto w-full sm:w-auto flex items-center gap-2 rounded-xl border border-[#d8e2f2] bg-white px-2 py-1.5 shadow-[0_6px_18px_rgba(38,72,132,0.08)]">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            :class="activeTab === tab.id
              ? 'bg-[#145fc9] text-white'
              : 'text-[#5c6f8e] hover:text-[#23334d] hover:bg-[#eef3fb]'"
          >
            {{ tab.label }}
          </button>
        </div>

        <button
          class="sm:ml-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-[#374b69] border border-[#d3deee] bg-white hover:bg-[#eef3fb] transition-colors"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </nav>

    <main class="flex-1 w-full flex flex-col pb-6">
      <KeepAlive>
        <BoostingBoard v-if="activeTab === 'boost'" />
        <OrderLogs v-else-if="activeTab === 'logs'" />
      </KeepAlive>
    </main>

    <AdminPanel v-if="showAdmin" @close="showAdmin = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BoostingBoard from '../components/BoostingBoard.vue'
import OrderLogs from '../components/OrderLogs.vue'
import AdminPanel from '../components/AdminPanel.vue'
import { AUTH_FLAG } from '../router'

const router = useRouter()

const tabs = [
  { id: 'boost', label: 'Boosting Board' },
  { id: 'logs', label: 'Order Logs' },
]

const activeTab = ref('boost')
const showAdmin = ref(false)

let heartbeatInterval

async function sendHeartbeat() {
  const token = sessionStorage.getItem(AUTH_FLAG)
  if (!token) { router.push({ name: 'login' }); return }
  try {
    const res = await fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      sessionStorage.removeItem(AUTH_FLAG)
      router.push({ name: 'login' })
    }
  } catch { /* ignore network errors */ }
}

function handleKeydown(e) {
  if (e.altKey && e.key === 'a') {
    e.preventDefault()
    showAdmin.value = !showAdmin.value
  }
}

onMounted(() => {
  heartbeatInterval = setInterval(sendHeartbeat, 5000)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearInterval(heartbeatInterval)
  window.removeEventListener('keydown', handleKeydown)
})

async function logout() {
  const token = sessionStorage.getItem(AUTH_FLAG)
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  sessionStorage.removeItem(AUTH_FLAG)
  router.push({ name: 'login' })
}
</script>
