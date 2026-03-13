<template>
  <div class="min-h-screen w-full bg-gray-50 flex flex-col">
    <nav class="fixed w-full bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-4xl mx-auto px-6 flex items-center gap-1 h-12">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'bg-gray-800 text-white'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'"
        >
          {{ tab.label }}
        </button>

        <button
          class="ml-auto px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          @click="showAdmin = !showAdmin"
        >
          Admin
        </button>
        <button
          class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </nav>

    <main class="flex-1 w-full pt-12 flex flex-col">
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

onMounted(() => {
  heartbeatInterval = setInterval(sendHeartbeat, 30000)
})

onUnmounted(() => {
  clearInterval(heartbeatInterval)
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
