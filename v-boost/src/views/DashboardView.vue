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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BoostingBoard from '../components/BoostingBoard.vue'
import OrderLogs from '../components/OrderLogs.vue'
import { AUTH_FLAG } from '../router'

const router = useRouter()

const tabs = [
  { id: 'boost', label: 'Boosting Board' },
  { id: 'logs', label: 'Order Logs' },
]

const activeTab = ref('boost')

function logout() {
  sessionStorage.removeItem(AUTH_FLAG)
  router.push({ name: 'login' })
}
</script>
