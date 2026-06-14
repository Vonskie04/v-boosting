<template>
  <div class="flex-1 w-full px-3 py-4 sm:px-6 sm:py-7">
    <div class="board-shell mx-auto w-full max-w-6xl rounded-[30px] border border-[#d7e2f3] p-4 shadow-[0_30px_70px_rgba(23,57,110,0.18)] sm:p-7">
      <div class="board-glow board-glow-left"></div>
      <div class="board-glow board-glow-right"></div>

      <div class="relative z-10 flex flex-col gap-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.28em] text-[#617999]">order control</p>
            <h2 class="mt-2 text-2xl font-extrabold text-[#1b2e4a] sm:text-4xl">Boosting Board</h2>
            <p class="mt-2 max-w-xl text-sm text-[#526885]">
              All services are available here. Paste TikTok links from desktop or mobile share flow and place an order in one step.
            </p>
          </div>

          <div class="relative self-end sm:self-start">
            <button
              type="button"
              @click="toggleBalance"
              class="inline-flex items-center gap-2 rounded-xl border border-[#d8e2f2] bg-white/95 px-4 py-2 text-sm font-semibold text-[#415a80] shadow-sm transition-colors hover:bg-white hover:text-[#1f3150]"
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
                class="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#d8e2f2] bg-white p-4 shadow-[0_18px_44px_rgba(27,57,102,0.2)]"
              >
                <div v-if="balanceLoading" class="text-sm text-[#6a7f9f]">Loading...</div>
                <div v-else-if="balanceError" class="text-sm text-rose-600">{{ balanceError }}</div>
                <div v-else-if="balance !== null" class="flex flex-col gap-1">
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#6a7f9f]">Account Balance</p>
                  <div class="inline-flex w-fit gap-0.5 rounded-lg border border-[#d8e2f2] bg-[#f7faff] p-0.5">
                    <button
                      type="button"
                      @click="setBalanceCurrency('EUR')"
                      class="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                      :class="balanceCurrency === 'EUR' ? 'bg-white text-[#1f3150] shadow-sm' : 'text-[#6a7f9f] hover:text-[#1f3150]'"
                    >
                      EUR
                    </button>
                    <button
                      type="button"
                      @click="setBalanceCurrency('USD')"
                      class="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                      :class="balanceCurrency === 'USD' ? 'bg-white text-[#1f3150] shadow-sm' : 'text-[#6a7f9f] hover:text-[#1f3150]'"
                    >
                      USD
                    </button>
                  </div>
                  <p class="text-2xl font-bold text-[#153663]">{{ formattedBalance }}</p>
                  <p v-if="balanceCurrency === 'USD' && hasUsdRate" class="text-[11px] text-[#6a7f9f]">1 EUR = {{ usdRate.toFixed(4) }} USD</p>
                  <p v-else-if="balanceCurrency === 'USD'" class="text-[11px] text-[#6a7f9f]">USD conversion is currently unavailable.</p>
                </div>
                <button
                  type="button"
                  @click="fetchBalance"
                  :disabled="balanceLoading"
                  class="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#f3f7ff] py-1.5 text-xs font-semibold text-[#5a7193] transition-colors hover:text-[#1f3150] disabled:opacity-40"
                >
                  <svg :class="balanceLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="stat-tile">
            <p class="stat-label">Total services</p>
            <p class="stat-value">{{ services.length }}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-label">Categories</p>
            <p class="stat-value">{{ categoryCount }}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-label">Selected rate</p>
            <p class="stat-value text-lg sm:text-xl">{{ selectedServiceRateLabel }}</p>
          </div>
        </div>

        <div class="rounded-3xl border border-[#d6e1f1] bg-white/90 p-4 sm:p-6">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="cat in categories"
              :key="cat.value"
              type="button"
              @click="selectedCategory = cat.value"
              :disabled="loading || servicesLoading"
              class="rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
              :class="selectedCategory === cat.value
                ? 'border-[#145fc9] bg-[#145fc9] text-white shadow-[0_10px_20px_rgba(20,95,201,0.28)]'
                : 'border-[#d2deee] bg-white text-[#4f6688] hover:border-[#b6cae6] hover:bg-[#f2f7ff]'"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div class="space-y-4">
              <div class="space-y-2 text-left">
                <label for="service-search" class="text-sm font-semibold text-[#23344f]">Find service</label>
                <input
                  id="service-search"
                  v-model="serviceSearch"
                  type="text"
                  placeholder="Search by service name or category"
                  class="w-full rounded-xl border border-[#cfdceb] bg-white px-4 py-3 focus:border-[#3b78da] focus:outline-none focus:ring-4 focus:ring-[#3b78da]/15"
                  :disabled="loading || servicesLoading"
                />
              </div>

              <div class="space-y-2 text-left">
                <div class="flex items-center justify-between gap-2">
                  <label for="service" class="text-sm font-semibold text-[#23344f]">Service list</label>
                  <button
                    type="button"
                    @click="loadServices(selectedCategory)"
                    :disabled="loading || servicesLoading"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#4f6485] transition-colors hover:text-[#1f3150] disabled:opacity-40"
                    title="Refresh services"
                  >
                    <svg :class="servicesLoading ? 'animate-spin' : ''" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 6.36 2.64L21 3v6h-6"/>
                    </svg>
                    Refresh
                  </button>
                </div>

                <select
                  v-if="!servicesLoading && filteredServices.length"
                  id="service"
                  v-model="selectedService"
                  class="w-full rounded-xl border border-[#cfdceb] bg-white px-4 py-3 focus:border-[#3b78da] focus:outline-none focus:ring-4 focus:ring-[#3b78da]/15"
                  :disabled="loading"
                >
                  <option v-for="svc in filteredServices" :key="svc.service" :value="svc.service">
                    {{ svc.name }}
                  </option>
                </select>
                <div v-else-if="servicesLoading" class="px-1 text-sm text-[#6a7f9f]">Loading services...</div>
                <div v-else-if="servicesError" class="px-1 text-sm text-rose-600">Could not load services. Is the server running?</div>
                <div v-else class="px-1 text-sm text-[#6a7f9f]">No services found for this filter.</div>
              </div>
            </div>

            <div class="service-preview">
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[#6c81a0]">Selected service</p>
              <p class="mt-2 text-lg font-bold text-[#1b2f4c]">{{ selectedServiceData?.name || 'Pick a service' }}</p>
              <p class="mt-1 text-sm text-[#5f7493]">{{ selectedServiceData?.category || 'Category unavailable' }}</p>
              <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div class="mini-stat">
                  <span class="mini-label">Rate / 1k</span>
                  <span class="mini-value">{{ selectedServiceRateLabel }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">Min</span>
                  <span class="mini-value">{{ selectedServiceData?.min ?? '-' }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">Max</span>
                  <span class="mini-value">{{ selectedServiceData?.max ?? '-' }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">Refill</span>
                  <span class="mini-value">{{ selectedServiceData?.refill ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="space-y-2 text-left md:col-span-2">
              <label for="social-url" class="text-sm font-semibold text-[#23344f]">{{ urlFieldLabel }}</label>
              <input
                id="social-url"
                v-model="url"
                type="text"
                inputmode="url"
                autocapitalize="off"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                :placeholder="urlPlaceholder"
                class="w-full rounded-xl border border-[#cfdceb] bg-white px-4 py-3 focus:border-[#3b78da] focus:outline-none focus:ring-4 focus:ring-[#3b78da]/15"
                :disabled="loading"
              />
              <p class="text-xs text-[#5d7391]">Paste a full {{ platformName }} link. Mobile share links are accepted where supported.</p>
            </div>

            <div class="space-y-2 text-left">
              <label for="quantity" class="text-sm font-semibold text-[#23344f]">Quantity</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in [500, 1000, 5000]"
                  :key="preset"
                  type="button"
                  @click="setPresetQuantity(preset)"
                  :disabled="loading"
                  class="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                  :class="!showCustomQuantity && quantity === preset ? 'border-[#145fc9] bg-[#145fc9] text-white' : 'border-[#cfdceb] bg-white text-[#4b6388] hover:bg-[#edf3fd]'"
                >
                  {{ preset }}
                </button>
                <button
                  type="button"
                  @click="showCustomQuantity = !showCustomQuantity"
                  :disabled="loading"
                  class="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                  :class="showCustomQuantity ? 'border-[#145fc9] bg-[#145fc9] text-white' : 'border-[#cfdceb] bg-white text-[#4b6388] hover:bg-[#edf3fd]'"
                >
                  Custom
                </button>
              </div>
              <div v-if="showCustomQuantity" class="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  v-model.number="customQuantity"
                  type="number"
                  min="100"
                  max="100000"
                  placeholder="100 - 100000"
                  class="w-full rounded-xl border border-[#cfdceb] px-3 py-2.5 text-sm focus:border-[#3b78da] focus:outline-none focus:ring-4 focus:ring-[#3b78da]/15"
                  :disabled="loading"
                />
                <button
                  type="button"
                  @click="applyCustomQuantity"
                  :disabled="loading"
                  class="rounded-xl border border-[#cfdceb] bg-white px-4 py-2.5 text-sm font-semibold text-[#4f6485] hover:bg-[#edf3fd]"
                >
                  Apply
                </button>
              </div>
              <p class="text-xs text-[#5d7391]">Estimated price: <span class="font-semibold text-[#1d3557]">{{ estimatedPriceLabel }}</span></p>
            </div>

            <div class="flex items-end">
              <button
                @click="submitBoost"
                :disabled="loading || !url || !quantity || !selectedService"
                class="w-full rounded-xl bg-[#145fc9] px-4 py-3 font-semibold tracking-wide text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#114ea5] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <span v-if="loading">Submitting order...</span>
                <span v-else>Place Boost Order</span>
              </button>
            </div>
          </div>

          <p v-if="error" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{{ error }}</p>

          <div v-if="orderId" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-semibold">Order placed successfully!</p>
                <p class="mt-1">Order ID: <span class="font-mono font-bold">{{ orderId }}</span></p>
              </div>
              <button
                type="button"
                @click="resetOrder"
                class="shrink-0 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                + New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const categories = [
  { label: 'All Services', value: 'all' },
  { label: 'TikTok Services', value: 'tiktok' },
]

// Balance
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
    if (!hasUsdRate.value) return 'N/A'
    return formatCurrency(balance.value * usdRate.value, 'USD')
  }

  return formatCurrency(balance.value, 'EUR')
})

const url = ref('')
const quantity = ref(1000)
const loading = ref(false)
const error = ref('')
const orderId = ref(null)

const selectedCategory = ref('all')
const services = ref([])
const selectedService = ref(null)
const servicesLoading = ref(false)
const servicesError = ref(false)
const serviceSearch = ref('')

const showCustomQuantity = ref(false)
const customQuantity = ref(null)

const filteredServices = computed(() => {
  const term = serviceSearch.value.trim().toLowerCase()
  if (!term) return services.value

  return services.value.filter(svc => {
    const haystack = `${svc.name ?? ''} ${svc.category ?? ''}`.toLowerCase()
    return haystack.includes(term)
  })
})

const selectedServiceData = computed(() =>
  services.value.find(item => String(item.service) === String(selectedService.value)) || null
)

const categoryCount = computed(() => {
  const keys = new Set(
    services.value
      .map(item => (item.category || '').trim())
      .filter(Boolean)
  )
  return keys.size
})

const selectedServiceRateLabel = computed(() => {
  const raw = Number.parseFloat(selectedServiceData.value?.rate)
  if (!Number.isFinite(raw)) return '-'
  return `${raw.toFixed(2)} ${balanceCurrency.value}`
})

const platformName = computed(() => {
  const text = `${selectedServiceData.value?.name ?? ''} ${selectedServiceData.value?.category ?? ''}`.toLowerCase()
  if (text.includes('instagram')) return 'Instagram'
  if (text.includes('youtube')) return 'YouTube'
  if (text.includes('facebook')) return 'Facebook'
  if (text.includes('twitter') || text.includes(' x ')) return 'X/Twitter'
  if (text.includes('telegram')) return 'Telegram'
  if (text.includes('spotify')) return 'Spotify'
  return 'TikTok'
})

const urlFieldLabel = computed(() => `${platformName.value} URL`)

const urlPlaceholder = computed(() => {
  const placeholders = {
    TikTok: 'https://www.tiktok.com/@user/video/... or vm.tiktok.com/...',
    Instagram: 'https://www.instagram.com/p/...',
    YouTube: 'https://www.youtube.com/watch?v=... or https://youtu.be/...',
    Facebook: 'https://www.facebook.com/...',
    'X/Twitter': 'https://x.com/... or https://twitter.com/...',
    Telegram: 'https://t.me/...',
    Spotify: 'https://open.spotify.com/...',
  }
  return placeholders[platformName.value] || 'https://example.com/...'
})

const estimatedPriceLabel = computed(() => {
  const rate = Number.parseFloat(selectedServiceData.value?.rate)
  const qty = Number(quantity.value)
  if (!Number.isFinite(rate) || !Number.isFinite(qty) || qty <= 0) return '-'

  const eurEstimate = (rate * qty) / 1000
  if (balanceCurrency.value === 'USD') {
    if (!hasUsdRate.value) return 'N/A (USD rate unavailable)'
    return formatCurrency(eurEstimate * usdRate.value, 'USD')
  }

  return formatCurrency(eurEstimate, 'EUR')
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
  } catch (err) {
    balanceError.value = err.message || 'Failed to load balance.'
  } finally {
    balanceLoading.value = false
  }
}

function setBalanceCurrency(currency) {
  balanceCurrency.value = currency
}

function toggleBalance() {
  balanceOpen.value = !balanceOpen.value
  if (balanceOpen.value && balance.value === null && !balanceLoading.value) {
    fetchBalance()
  }
}

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

function normalizeTikTokUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
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

    const selectable = Array.isArray(data)
      ? data.filter(item => /^\d+$/.test(String(item?.service ?? '')))
      : []

    services.value = selectable

    const viewsService = selectable.find(s => /views?/i.test(s.name || ''))
    selectedService.value = (viewsService ?? selectable[0])?.service ?? null
  } catch {
    servicesError.value = true
  } finally {
    servicesLoading.value = false
  }
}

watch(selectedCategory, cat => {
  serviceSearch.value = ''
  loadServices(cat)
}, { immediate: true })

watch(filteredServices, list => {
  if (!list.length) {
    selectedService.value = null
    return
  }
  const stillExists = list.some(item => String(item.service) === String(selectedService.value))
  if (!stillExists) {
    selectedService.value = list[0].service
  }
})

async function submitBoost() {
  error.value = ''
  orderId.value = null
  loading.value = true

  try {
    const normalizedUrl = normalizeTikTokUrl(url.value)
    url.value = normalizedUrl

    const res = await fetch('/api/boost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: normalizedUrl,
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
.board-shell {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(130deg, rgba(252, 249, 242, 0.94), rgba(237, 245, 255, 0.92) 65%),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 8px, rgba(255, 255, 255, 0.18) 8px, rgba(255, 255, 255, 0.18) 16px);
}

.board-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(38px);
  opacity: 0.75;
}

.board-glow-left {
  left: -120px;
  top: -100px;
  width: 320px;
  height: 320px;
  background: #ffd7a8;
}

.board-glow-right {
  right: -100px;
  top: 20px;
  width: 300px;
  height: 300px;
  background: #c8ddff;
}

.stat-tile {
  border: 1px solid #d2deef;
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.88);
}

.stat-label {
  margin: 0;
  color: #667c9c;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 700;
}

.stat-value {
  margin: 6px 0 0;
  color: #1d3457;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
}

.service-preview {
  border: 1px solid #d2def0;
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(245, 250, 255, 0.9), rgba(236, 244, 255, 0.72));
}

.mini-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid #d7e3f3;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 10px;
}

.mini-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6780a3;
  font-weight: 700;
}

.mini-value {
  color: #213a5c;
  font-size: 13px;
  font-weight: 700;
}

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
</style>