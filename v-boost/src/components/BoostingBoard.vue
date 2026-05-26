<template>
  <div class="flex-1 w-full flex items-start justify-center p-3 sm:p-6">
    <div class="w-full max-w-6xl bg-white/82 backdrop-blur-xl rounded-3xl shadow-[0_26px_80px_rgba(24,57,109,0.16)] p-4 sm:p-8 border border-[#d8e2f2] flex flex-col items-center relative overflow-hidden">

      <div class="absolute -left-28 -top-24 size-72 rounded-full bg-[#ffe0b8]/55 blur-3xl"></div>
      <div class="absolute -right-24 top-8 size-72 rounded-full bg-[#d2e4ff]/70 blur-3xl"></div>

      <!-- Balance widget -->
      <div class="relative z-10 self-end sm:absolute sm:top-4 sm:right-4 mb-3 sm:mb-0">
        <button
          type="button"
          @click="toggleBalance"
          class="flex items-center gap-1.5 text-sm font-semibold text-[#456187] hover:text-[#20314c] bg-white/90 hover:bg-white border border-[#d8e2f2] rounded-xl px-3.5 py-2 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M16 12h.01"/>
            <path d="M2 10h20"/>
          </svg>
          Balance
          <svg :class="balanceOpen ? 'rotate-180' : ''"
            class="transition-transform duration-200"
            xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        <transition name="balance-dropdown">
          <div
            v-if="balanceOpen"
            class="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-[#d8e2f2] rounded-2xl shadow-[0_18px_44px_rgba(27,57,102,0.2)] p-4 z-10"
          >
            <div v-if="balanceLoading" class="text-sm text-[#6a7f9f]">Loading...</div>
            <div v-else-if="balanceError" class="text-sm text-rose-600">{{ balanceError }}</div>
            <div v-else-if="balance !== null" class="flex flex-col gap-1">
              <p class="text-xs text-[#6a7f9f] uppercase tracking-wide font-semibold">Account Balance</p>
              <div class="inline-flex w-fit rounded-lg border border-[#d8e2f2] bg-[#f7faff] p-0.5 gap-0.5">
                <button
                  type="button"
                  @click="balanceCurrency = 'EUR'"
                  class="px-2 py-1 text-[11px] font-semibold rounded-md transition-colors"
                  :class="balanceCurrency === 'EUR' ? 'bg-white text-[#1f3150] shadow-sm' : 'text-[#6a7f9f] hover:text-[#1f3150]'"
                >
                  EUR
                </button>
                <button
                  type="button"
                  @click="balanceCurrency = 'USD'"
                  :disabled="!hasUsdRate"
                  class="px-2 py-1 text-[11px] font-semibold rounded-md transition-colors disabled:opacity-40"
                  :class="balanceCurrency === 'USD' ? 'bg-white text-[#1f3150] shadow-sm' : 'text-[#6a7f9f] hover:text-[#1f3150]'"
                >
                  USD
                </button>
              </div>
              <p class="text-2xl font-bold text-[#153663]">{{ formattedBalance }}</p>
              <p v-if="balanceCurrency === 'USD' && hasUsdRate" class="text-[11px] text-[#6a7f9f]">
                1 EUR = {{ usdRate.toFixed(4) }} USD
              </p>
              <p v-else-if="balanceCurrency === 'USD'" class="text-[11px] text-[#6a7f9f]">
                USD conversion is currently unavailable.
              </p>
            </div>
            <button
              type="button"
              @click="fetchBalance"
              :disabled="balanceLoading"
              class="mt-3 w-full text-xs font-semibold text-[#5a7193] hover:text-[#1f3150] rounded-lg bg-[#f3f7ff] py-1.5 flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
            >
              <svg :class="balanceLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
              </svg>
              Refresh
            </button>
          </div>
        </transition>
      </div>

      <div class="relative z-1 text-center">
        <p class="text-[11px] uppercase tracking-[0.24em] text-[#6a7f9f] font-semibold">v-boost toolkit</p>
        <h1 class="mt-2 text-2xl sm:text-4xl font-semibold text-[#1a2944]">Boosting Board</h1>
      </div>

      <div class="w-full mt-4 sm:mt-6 relative z-1">
        <div class="flex flex-col gap-5 max-w-2xl mx-auto">

          <!-- Category dropdown -->
          <div class="flex flex-col gap-2 text-left">
            <label for="category" class="text-sm font-semibold text-[#22334f]">Category</label>
            <select
              id="category"
              v-model="selectedCategory"
              class="w-full border border-[#cfdceb] rounded-xl px-4 py-3 focus:outline-none focus:border-[#3b78da] focus:ring-4 focus:ring-[#3b78da]/15 bg-white"
              :disabled="loading || servicesLoading"
            >
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <!-- Service selector -->
          <div class="flex flex-col gap-2 text-left">
            <div class="flex items-center justify-between">
              <label for="service" class="text-sm font-semibold text-[#22334f]">Service</label>
              <button
                type="button"
                @click="loadServices(selectedCategory)"
                :disabled="loading || servicesLoading"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4f6485] hover:text-[#1f3150] rounded-lg border border-[#d8e2f2] bg-white px-3 py-1.5 transition-colors disabled:opacity-40"
                title="Refresh services"
              >
                <svg :class="servicesLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
                </svg>
                Refresh
              </button>
            </div>
            <select
              v-if="!servicesLoading && services.length"
              id="service"
              v-model="selectedService"
              class="w-full border border-[#cfdceb] rounded-xl px-4 py-3 focus:outline-none focus:border-[#3b78da] focus:ring-4 focus:ring-[#3b78da]/15 bg-white"
              :disabled="loading"
            >
              <option
                v-for="svc in services"
                :key="svc.service"
                :value="svc.service"
                :disabled="Boolean(svc.externalUrl)"
              >
                {{ svc.externalUrl ? `${svc.name} (link)` : svc.name }}
              </option>
            </select>
            <div v-else-if="servicesLoading" class="text-sm text-[#6a7f9f] px-1">Loading services...</div>
            <div v-else-if="servicesError" class="text-sm text-rose-600 px-1">Could not load services. Is the server running?</div>
            <div v-else class="text-sm text-[#6a7f9f] px-1">No services found for this category.</div>
            <a
              v-if="selectedCategory === 'free'"
              :href="FREE_TIKTOK_VIEWS_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-semibold text-[#145fc9] hover:text-[#114ea5] underline underline-offset-2"
            >
              Open Free TikTok Views page
            </a>

            <div
              v-if="selectedCategory === 'free'"
              class="mt-2 rounded-2xl border border-[#d8e2f2] bg-white p-2.5 shadow-[0_12px_30px_rgba(20,62,120,0.08)]"
            >
              <iframe
                :src="FREE_TIKTOK_VIEWS_EMBED_URL"
                title="Free TikTok Views"
                loading="lazy"
                class="free-embed-frame w-full rounded-xl border border-[#d8e2f2] bg-white"
              ></iframe>
              <p class="px-1 pt-2 text-[11px] text-[#6a7f9f]">
                If the page does not render correctly, use the link above to open it in a new tab.
              </p>
            </div>
          </div>

          <!-- TikTok URL -->
          <div class="flex flex-col gap-2 text-left">
            <label for="tiktok-url" class="text-sm font-semibold text-[#22334f]">TikTok URL</label>
            <input
              id="tiktok-url"
              v-model="url"
              type="url"
              placeholder="https://www.tiktok.com/@user/video/..."
              class="w-full border border-[#cfdceb] rounded-xl px-4 py-3 focus:outline-none focus:border-[#3b78da] focus:ring-4 focus:ring-[#3b78da]/15"
              :disabled="loading"
            />
          </div>

          <!-- Quantity -->
          <div class="flex flex-col gap-2 text-left">
            <label for="quantity" class="text-sm font-semibold text-[#22334f]">Quantity</label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                @click="setPresetQuantity(100)"
                :disabled="loading"
                class="px-3 py-2 rounded-xl border text-sm font-semibold transition-colors"
                :class="!showCustomQuantity && quantity === 100 ? 'bg-[#145fc9] text-white border-[#145fc9]' : 'bg-white text-[#4b6388] border-[#cfdceb] hover:bg-[#edf3fd]'"
              >
                100
              </button>
              <button
                type="button"
                @click="setPresetQuantity(1000)"
                :disabled="loading"
                class="px-3 py-2 rounded-xl border text-sm font-semibold transition-colors"
                :class="!showCustomQuantity && quantity === 1000 ? 'bg-[#145fc9] text-white border-[#145fc9]' : 'bg-white text-[#4b6388] border-[#cfdceb] hover:bg-[#edf3fd]'"
              >
                1000
              </button>
              <button
                type="button"
                @click="showCustomQuantity = !showCustomQuantity"
                :disabled="loading"
                class="px-3 py-2 rounded-xl border text-sm font-semibold transition-colors"
                :class="showCustomQuantity ? 'bg-[#145fc9] text-white border-[#145fc9]' : 'bg-white text-[#4b6388] border-[#cfdceb] hover:bg-[#edf3fd]'"
              >
                Custom
              </button>
            </div>
            <div v-if="showCustomQuantity" class="flex flex-col sm:flex-row gap-2">
              <input
                v-model.number="customQuantity"
                type="number"
                min="100"
                max="100000"
                placeholder="Enter custom quantity"
                class="w-full border border-[#cfdceb] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b78da] focus:ring-4 focus:ring-[#3b78da]/15"
                :disabled="loading"
              />
              <button
                type="button"
                @click="applyCustomQuantity"
                :disabled="loading"
                class="px-3 py-2.5 rounded-xl border border-[#cfdceb] text-sm font-semibold text-[#4f6485] bg-white hover:bg-[#edf3fd]"
              >
                Set
              </button>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{{ error }}</p>

          <!-- Success -->
          <div v-if="orderId" class="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p class="font-semibold">Order placed successfully!</p>
                <p class="mt-1">Order ID: <span class="font-mono font-bold">{{ orderId }}</span></p>
              </div>
              <button
                type="button"
                @click="resetOrder"
                class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                + New Order
              </button>
            </div>
          </div>

          <!-- Boost button -->
          <button
            @click="submitBoost"
            :disabled="loading || !url || !quantity || !selectedService"
            class="w-full bg-[#145fc9] text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:bg-[#114ea5] hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
          >
            <span v-if="loading">Boosting...</span>
            <span v-else>Boost</span>
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const FREE_TIKTOK_VIEWS_URL = 'https://zefame.com/free-tiktok-views'
const FREE_TIKTOK_VIEWS_EMBED_URL = '/api/free-tiktok-views/embed'

// ── Balance ───────────────────────────────────────────────────────────────
const balanceOpen = ref(false)
const balanceLoading = ref(false)
const balanceError = ref('')
const balance = ref(null)
const balanceCurrency = ref('EUR')
const usdRate = ref(null)

const hasUsdRate = computed(() => Number.isFinite(usdRate.value) && usdRate.value > 0)

const formattedBalance = computed(() => {
  if (balance.value === null) return ''

  if (balanceCurrency.value === 'USD') {
    if (!hasUsdRate.value) {
      return 'N/A'
    }
    return formatCurrency(balance.value * usdRate.value, 'USD')
  }

  return formatCurrency(balance.value, 'EUR')
})

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

async function fetchBalance() {
  balanceLoading.value = true
  balanceError.value = ''
  try {
    const [balResult, fxResult] = await Promise.allSettled([
      fetch('/api/balance'),
      fetch('https://api.frankfurter.app/latest?from=EUR&to=USD'),
    ])

    if (balResult.status !== 'fulfilled') {
      throw new Error('Could not reach balance API')
    }

    const balRes = balResult.value
    if (!balRes.ok) throw new Error('Bad response from balance API')
    const data = await balRes.json()
    if (data.error) throw new Error(data.error)

    const eurAmount = parseFloat(data.balance)
    if (!Number.isFinite(eurAmount)) {
      throw new Error('Invalid balance response')
    }

    let rate = null
    if (fxResult.status === 'fulfilled' && fxResult.value.ok) {
      const fxData = await fxResult.value.json()
      const nextRate = Number(fxData?.rates?.USD)
      if (Number.isFinite(nextRate) && nextRate > 0) {
        rate = nextRate
      }
    }

    balance.value = eurAmount
    usdRate.value = rate

    if (balanceCurrency.value === 'USD' && !hasUsdRate.value) {
      balanceCurrency.value = 'EUR'
    }
  } catch (err) {
    balanceError.value = err.message || 'Failed to load balance.'
  } finally {
    balanceLoading.value = false
  }
}

function toggleBalance() {
  balanceOpen.value = !balanceOpen.value
  if (balanceOpen.value && balance.value === null && !balanceLoading.value) {
    fetchBalance()
  }
}

const url = ref('')
const quantity = ref(1000)
const loading = ref(false)
const error = ref('')
const orderId = ref(null)

const categories = [
  { label: 'TikTok Services', value: 'tiktok' },
  { label: 'Free Services',   value: 'free'   },
]
const selectedCategory = ref('tiktok')

const services = ref([])
const selectedService = ref(null)
const servicesLoading = ref(false)
const servicesError = ref(false)
const showCustomQuantity = ref(false)
const customQuantity = ref(null)
function resetOrder() {
  orderId.value = null
  url.value = ''
  quantity.value = 1000
  error.value = ''
  showCustomQuantity.value = false
  customQuantity.value = null
}

function setPresetQuantity(value) {
  quantity.value = value
  showCustomQuantity.value = false
  error.value = ''
}

function applyCustomQuantity() {
  const value = Number(customQuantity.value)

  if (!Number.isFinite(value) || value < 100 || value > 100000) {
    error.value = 'Custom quantity must be between 100 and 100000.'
    return
  }

  quantity.value = Math.floor(value)
  error.value = ''
  showCustomQuantity.value = false
}

async function loadServices(filter) {
  servicesLoading.value = true
  servicesError.value = false
  services.value = []
  selectedService.value = null

  try {
    const res = await fetch(`/api/services?filter=${filter}`)
    if (!res.ok) throw new Error('Bad response')
    const data = await res.json()

    services.value = data
    // Auto-select first "views" match, else first item
    const viewsService = data.find(s => !s.externalUrl && /views?/i.test(s.name))
    const firstSelectable = data.find(s => !s.externalUrl)
    selectedService.value = (viewsService ?? firstSelectable)?.service ?? null
  } catch {
    servicesError.value = true
  } finally {
    servicesLoading.value = false
  }
}

// Load services whenever the category changes (and on first render)
watch(selectedCategory, (cat) => loadServices(cat), { immediate: true })

async function submitBoost() {
  error.value = ''
  orderId.value = null
  loading.value = true

  try {
    const res = await fetch('/api/boost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.value,
        service: selectedService.value,
        quantity: quantity.value,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || 'Something went wrong. Please try again.'
      return
    }

    if (data.error) {
      error.value = data.error
      return
    }

    orderId.value = data.order
    url.value = ''
  } catch {
    error.value = 'Network error. Make sure the server is running.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.balance-dropdown-enter-active,
.balance-dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform-origin: top right;
}

.balance-dropdown-enter-from,
.balance-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.free-embed-frame {
  height: 620px;
}

@media (max-width: 640px) {
  .free-embed-frame {
    height: 72vh;
    min-height: 460px;
  }
}
</style>