<template>
  <div class="flex-1 w-full flex items-start justify-center p-4 sm:p-6">
    <div class="w-full max-w-6xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_24px_70px_rgba(33,67,121,0.14)] p-5 sm:p-8 border border-[#d8e2f2]">
      <div class="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-[#6a7f9f] font-semibold">History</p>
          <h2 class="mt-1 text-xl sm:text-2xl font-semibold text-[#1f2d45]">Order Logs</h2>
        </div>
        <button
          type="button"
          @click="fetchAuditLogs"
          class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#4f6485] hover:text-[#1d3254] rounded-lg border border-[#d8e2f2] bg-white px-3 py-2 transition-colors"
        >
          <svg :class="auditLogsLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
          </svg>
          Refresh
        </button>
      </div>

      <div v-if="auditLogsLoading" class="text-sm text-[#6a7f9f]">Loading...</div>

      <div v-else-if="!auditLogs.length" class="text-sm text-[#6a7f9f] rounded-xl border border-dashed border-[#cfdbed] bg-[#f7faff] px-4 py-5">No orders yet.</div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="log in auditLogs"
          :key="log.id"
          class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm px-4 py-3 rounded-xl border"
          :class="log.status === 'success' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' : 'bg-rose-50/80 border-rose-200 text-rose-700'"
        >
          <span class="inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-wide font-semibold"
            :class="log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
            {{ log.status }}
          </span>
          <span class="shrink-0 font-mono text-[#58708f]">{{ formatLogDate(log.time) }}</span>
          <span class="truncate flex-1 text-[#244064]" :title="log.url">{{ log.url }}</span>
          <span class="shrink-0 font-semibold text-[#1d3557]">x{{ log.quantity }}</span>
          <span v-if="log.orderId" class="shrink-0 font-mono text-[#145ec7]">#{{ log.orderId }}</span>
          <span v-else class="shrink-0 text-rose-700">{{ log.error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const auditLogs = ref([])
const auditLogsLoading = ref(false)

function formatLogDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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