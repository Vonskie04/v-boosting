<template>
  <div class="flex-1 w-full flex items-start justify-center p-6">
    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800">Order Logs</h2>
        <button
          type="button"
          @click="fetchAuditLogs"
          class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg :class="auditLogsLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
          </svg>
          Refresh
        </button>
      </div>

      <div v-if="auditLogsLoading" class="text-sm text-gray-400">Loading...</div>

      <div v-else-if="!auditLogs.length" class="text-sm text-gray-400">No orders yet.</div>

      <div v-else class="flex flex-col gap-1">
        <div
          v-for="log in auditLogs"
          :key="log.id"
          class="flex items-start gap-3 text-xs px-3 py-2 rounded-lg border"
          :class="log.status === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-700'"
        >
          <span class="shrink-0 font-mono text-gray-400">{{ new Date(log.time).toLocaleTimeString() }}</span>
          <span class="truncate flex-1" :title="log.url">{{ log.url }}</span>
          <span class="shrink-0 font-medium">×{{ log.quantity }}</span>
          <span v-if="log.orderId" class="shrink-0 font-mono">#{{ log.orderId }}</span>
          <span v-else class="shrink-0">{{ log.error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const auditLogs = ref([])
const auditLogsLoading = ref(false)

async function fetchAuditLogs() {
  auditLogsLoading.value = true
  try {
    const res = await fetch('/api/audit-logs')
    if (res.ok) auditLogs.value = await res.json()
  } catch { /* non-critical */ } finally {
    auditLogsLoading.value = false
  }
}

onMounted(fetchAuditLogs)

defineExpose({ fetchAuditLogs })
</script>

<style scoped>

</style>