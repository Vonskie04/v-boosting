<template>
  <div class="min-h-screen w-full flex flex-col">
    <transition name="welcome-gate">
      <div
        v-if="showWelcome"
        class="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#10213b]"
        aria-live="polite"
      >
        <div class="welcome-sweep welcome-sweep-left"></div>
        <div class="welcome-sweep welcome-sweep-right"></div>
        <div class="relative z-10 px-6 text-center">
          <p class="welcome-kicker">v-boost dashboard</p>
          <h2 class="welcome-title">WELCOME BACK VON</h2>
          <div class="welcome-line"></div>
        </div>
      </div>
    </transition>

    <nav class="sticky top-0 z-40 w-full border-b border-[#d8e2f2] bg-white/70 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-6">
        <div class="order-1">
          <p class="text-[11px] uppercase tracking-[0.2em] text-[#667997] font-semibold">Control Center</p>
          <div class="mt-1 flex items-center justify-between gap-3 sm:block">
            <h1 class="text-base font-semibold text-[#1a2740] sm:text-xl">v-boost Dashboard</h1>
            <button
              class="inline-flex items-center gap-2 rounded-xl border border-[#d3deee] bg-white px-3 py-2 text-sm font-semibold text-[#374b69] transition-colors hover:bg-[#eef3fb] sm:hidden"
              @click="logout"
            >
              <LogOut :size="16" class="shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          class="order-2 sm:order-3 self-end sm:self-auto sm:ml-2 hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#374b69] border border-[#d3deee] bg-white hover:bg-[#eef3fb] transition-colors"
          @click="logout"
        >
          <LogOut :size="16" class="shrink-0" aria-hidden="true" />
        </button>

        

        <div class="order-3 flex w-full items-center gap-1.5 rounded-xl border border-[#d8e2f2] bg-white px-1.5 py-1.5 shadow-[0_6px_18px_rgba(38,72,132,0.08)] sm:order-2 sm:ml-auto sm:w-auto sm:gap-2 sm:px-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm"
            :class="activeTab === tab.id
              ? 'bg-[#145fc9] text-white'
              : 'text-[#5c6f8e] hover:text-[#23334d] hover:bg-[#eef3fb]'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </nav>

    <main class="flex-1 w-full flex flex-col pb-6">
      <KeepAlive>
        <BoostingBoard v-if="activeTab === 'boost'" />
        <OrderLogs v-else-if="activeTab === 'logs'" />
      </KeepAlive>
    </main>

    <AdminPanel v-if="showAdmin" @close="showAdmin = false" />
    <FloatingClipboard />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from '@lucide/vue'
import BoostingBoard from '../components/BoostingBoard.vue'
import OrderLogs from '../components/OrderLogs.vue'
import AdminPanel from '../components/AdminPanel.vue'
import FloatingClipboard from '../components/FloatingClipboard.vue'
import { AUTH_FLAG, WELCOME_FLAG } from '../router'

const router = useRouter()

const tabs = [
  { id: 'boost', label: 'Boosting Board' },
  { id: 'logs', label: 'Order Logs' },
]

const activeTab = ref('boost')
const showAdmin = ref(false)
const showWelcome = ref(false)

let heartbeatInterval
let hasSentLogout = false
let welcomeTimer

async function notifyServerLogout({ keepalive = false } = {}) {
  const token = sessionStorage.getItem(AUTH_FLAG)
  if (!token || hasSentLogout) return

  hasSentLogout = true
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      keepalive,
    })
  } catch {
    // Best effort only. Session timeout cleanup handles failed unload requests.
  }
}

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

function handleAppExit() {
  void notifyServerLogout({ keepalive: true })
}

onMounted(() => {
  if (sessionStorage.getItem(WELCOME_FLAG) === '1') {
    sessionStorage.removeItem(WELCOME_FLAG)
    showWelcome.value = true
    welcomeTimer = setTimeout(() => {
      showWelcome.value = false
    }, 2400)
  }

  void sendHeartbeat()
  heartbeatInterval = setInterval(sendHeartbeat, 5000)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('pagehide', handleAppExit)
  window.addEventListener('beforeunload', handleAppExit)
})

onUnmounted(() => {
  clearInterval(heartbeatInterval)
  clearTimeout(welcomeTimer)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pagehide', handleAppExit)
  window.removeEventListener('beforeunload', handleAppExit)
})

async function logout() {
  await notifyServerLogout()
  sessionStorage.removeItem(AUTH_FLAG)
  router.push({ name: 'login' })
}
</script>

<style scoped>
.welcome-sweep {
  position: absolute;
  width: 56vmax;
  height: 56vmax;
  border-radius: 999px;
  filter: blur(56px);
  opacity: 0.7;
  animation: welcomeDrift 2.4s ease both;
}

.welcome-sweep-left {
  left: -22vmax;
  top: -18vmax;
  background: #ffbd78;
}

.welcome-sweep-right {
  right: -20vmax;
  bottom: -22vmax;
  background: #6fa6ff;
  animation-delay: 0.08s;
}

.welcome-kicker {
  margin: 0;
  color: rgba(226, 237, 255, 0.74);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  animation: welcomeRise 0.7s ease both 0.12s;
}

.welcome-title {
  margin: 14px 0 0;
  color: #ffffff;
  font-size: clamp(34px, 8vw, 82px);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.98;
  text-shadow: 0 18px 46px rgba(0, 0, 0, 0.32);
  animation: welcomeScale 0.85s cubic-bezier(0.2, 0.9, 0.2, 1) both 0.22s;
}

.welcome-line {
  width: min(320px, 72vw);
  height: 3px;
  margin: 22px auto 0;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
  animation: welcomeLine 1.15s ease both 0.48s;
}

.welcome-gate-enter-active,
.welcome-gate-leave-active {
  transition: opacity 0.42s ease, transform 0.42s ease;
}

.welcome-gate-enter-from,
.welcome-gate-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

@keyframes welcomeRise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes welcomeScale {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes welcomeLine {
  from {
    opacity: 0;
    transform: scaleX(0.2);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes welcomeDrift {
  from {
    transform: scale(0.9) translateY(18px);
  }
  to {
    transform: scale(1.08) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-sweep,
  .welcome-kicker,
  .welcome-title,
  .welcome-line {
    animation: none;
  }

  .welcome-gate-enter-active,
  .welcome-gate-leave-active {
    transition: opacity 0.18s ease;
  }
}
</style>
