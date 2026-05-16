<template>
  <main class="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10">
    <section class="w-full max-w-5xl rounded-3xl border border-[#d8e1ef] bg-white/75 backdrop-blur-xl shadow-[0_24px_90px_rgba(19,55,110,0.16)] overflow-hidden animate-[fadeIn_.55s_ease-out]">
      <div class="grid md:grid-cols-[1.08fr_1fr]">
        <aside class="order-2 md:order-1 relative p-6 sm:p-10 text-white" style="background: linear-gradient(140deg, #173563, #20447d 52%, #114a8d);">
          <div class="absolute -top-28 -right-20 size-72 rounded-full bg-[#79a8ff]/30 blur-3xl"></div>
          <div class="absolute -bottom-20 -left-20 size-72 rounded-full bg-[#ffbf7a]/30 blur-3xl"></div>
          <div class="relative">
            <p class="text-[11px] uppercase tracking-[0.24em] text-white/70 font-semibold">v-boost</p>
            <h1 class="mt-4 text-2xl sm:text-4xl font-semibold leading-tight">Secure Access Gateway</h1>
            <p class="mt-4 text-sm sm:text-base text-blue-100/90 max-w-md">
              Manage TikTok services, logs, and session control from one focused dashboard.
            </p>
            <div class="mt-6 sm:mt-8 grid grid-cols-2 gap-3 max-w-sm">
              <div class="rounded-xl border border-white/25 bg-white/10 px-3 py-3">
                <p class="text-[10px] uppercase tracking-[0.18em] text-white/75">Services</p>
                <p class="mt-1 inline-flex items-center gap-2 text-xl font-semibold">
                  <span
                    class="inline-block size-2.5 rounded-full"
                    :class="serviceStatus === 'live' ? 'bg-emerald-400' : serviceStatus === 'inactive' ? 'bg-rose-400' : 'bg-white/60'"
                  />
                  {{ serviceStatus === 'live' ? 'Live' : serviceStatus === 'inactive' ? 'Inactive' : 'Checking' }}
                </p>
              </div>
              <div class="rounded-xl border border-white/25 bg-white/10 px-3 py-3">
                <p class="text-[10px] uppercase tracking-[0.18em] text-white/75">Security</p>
                <p class="mt-1 text-xl font-semibold">Tokenized</p>
              </div>
            </div>
          </div>
        </aside>

        <form
          class="order-1 md:order-2 bg-white/90 p-6 sm:p-10 flex flex-col justify-center"
          @submit.prevent="handleSubmit"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d6f8e]">Authentication</p>
          <h2 class="mt-2 text-2xl font-semibold text-[#172235]">Enter Admin Password</h2>
          <p class="mt-2 text-sm text-[#607089]">Only authorized sessions can access dashboard controls.</p>

          <label class="mt-7 block text-sm font-medium text-[#22324a]" for="password">Password</label>
          <input
            id="password"
            v-model="passwordInput"
            type="password"
            class="mt-2 w-full rounded-xl border border-[#cfdae9] bg-white px-4 py-3 text-[#182439] outline-none transition focus:border-[#3a75d8] focus:ring-4 focus:ring-[#3a75d8]/15"
            placeholder="Enter password"
            autocomplete="current-password"
          />

          <button
            type="submit"
            :disabled="status === 'loading'"
            class="mt-5 w-full rounded-xl bg-[#145ec7] text-white py-3 font-semibold tracking-wide hover:bg-[#114ea5] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {{ status === 'loading' ? 'Checking...' : 'Enter Dashboard' }}
          </button>

          <p v-if="status === 'empty'" class="mt-3 text-sm text-amber-700">Please enter a password.</p>
          <p v-else-if="status === 'error'" class="mt-3 text-sm text-red-700">{{ errorMessage }}</p>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AUTH_FLAG } from '../router'

const router = useRouter()
const passwordInput = ref('')
const status = ref('idle')
const errorMessage = ref('')
const serviceStatus = ref('checking')
let serviceStatusInterval

async function checkServiceStatus() {
  try {
    const res = await fetch('/api/services?filter=tiktok', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!res.ok) {
      serviceStatus.value = 'inactive'
      return
    }

    const data = await res.json()
    serviceStatus.value = Array.isArray(data) && data.length > 0 ? 'live' : 'inactive'
  } catch {
    serviceStatus.value = 'inactive'
  }
}

onMounted(() => {
  checkServiceStatus()
  serviceStatusInterval = setInterval(checkServiceStatus, 30000)
})

onUnmounted(() => {
  clearInterval(serviceStatusInterval)
})

async function handleSubmit() {
  if (!passwordInput.value.trim()) {
    status.value = 'empty'
    return
  }

  status.value = 'loading'

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value }),
    })
    const data = await res.json()
    if (!res.ok) {
      errorMessage.value = data.error || 'Incorrect password.'
      status.value = 'error'
      return
    }
    sessionStorage.setItem(AUTH_FLAG, data.token)
    router.push({ name: 'dashboard' })
  } catch {
    errorMessage.value = 'Could not reach the server.'
    status.value = 'error'
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
