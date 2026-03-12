<template>
  <div class="flex-1 w-full flex items-start justify-center p-6">
    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100 flex flex-col items-center">
      <h1>
        BOOSTER AHA
      </h1>

      <div class="w-full mt-6">
        <div class="flex flex-col gap-4 max-w-md mx-auto">

          <!-- Category dropdown -->
          <div class="flex flex-col gap-2 text-left">
            <label for="category" class="text-sm font-medium text-gray-700">Category</label>
            <select
              id="category"
              v-model="selectedCategory"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
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
              <label for="service" class="text-sm font-medium text-gray-700">Service</label>
              <button
                type="button"
                @click="loadServices(selectedCategory)"
                :disabled="loading || servicesLoading"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-40"
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
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              :disabled="loading"
            >
              <option v-for="svc in services" :key="svc.service" :value="svc.service">
                {{ svc.name }}
              </option>
            </select>
            <div v-else-if="servicesLoading" class="text-sm text-gray-400 px-1">Loading services...</div>
            <div v-else-if="servicesError" class="text-sm text-red-500 px-1">Could not load services. Is the server running?</div>
            <div v-else class="text-sm text-gray-400 px-1">No services found for this category.</div>
          </div>

          <!-- TikTok URL -->
          <div class="flex flex-col gap-2 text-left">
            <label for="tiktok-url" class="text-sm font-medium text-gray-700">TikTok URL</label>
            <input
              id="tiktok-url"
              v-model="url"
              type="url"
              placeholder="https://www.tiktok.com/@user/video/..."
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              :disabled="loading"
            />
          </div>

          <!-- Quantity -->
          <div class="flex flex-col gap-2 text-left">
            <label for="quantity" class="text-sm font-medium text-gray-700">Quantity</label>
            <div class="flex gap-2">
              <button
                type="button"
                @click="setPresetQuantity(100)"
                :disabled="loading"
                class="px-3 py-1.5 rounded-md border text-sm font-medium transition-colors"
                :class="!showCustomQuantity && quantity === 100 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
              >
                100
              </button>
              <button
                type="button"
                @click="setPresetQuantity(1000)"
                :disabled="loading"
                class="px-3 py-1.5 rounded-md border text-sm font-medium transition-colors"
                :class="!showCustomQuantity && quantity === 1000 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
              >
                1000
              </button>
              <button
                type="button"
                @click="showCustomQuantity = !showCustomQuantity"
                :disabled="loading"
                class="px-3 py-1.5 rounded-md border text-sm font-medium transition-colors"
                :class="showCustomQuantity ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
              >
                Custom
              </button>
            </div>
            <div v-if="showCustomQuantity" class="flex gap-2">
              <input
                v-model.number="customQuantity"
                type="number"
                min="100"
                max="100000"
                placeholder="Enter custom quantity"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                :disabled="loading"
              />
              <button
                type="button"
                @click="applyCustomQuantity"
                :disabled="loading"
                class="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-100"
              >
                Set
              </button>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="orderId" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-semibold">Order placed successfully!</p>
                <p class="mt-1">Order ID: <span class="font-mono font-bold">{{ orderId }}</span></p>
              </div>
              <button
                type="button"
                @click="resetOrder"
                class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md border border-green-400 text-green-700 hover:bg-green-100 transition-colors"
              >
                + New Order
              </button>
            </div>
          </div>

          <!-- Boost button -->
          <button
            @click="submitBoost"
            :disabled="loading || !url || !quantity || !selectedService"
            class="w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-700 hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
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
import { ref, watch } from 'vue'

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
    const viewsService = data.find(s => /views?/i.test(s.name))
    selectedService.value = (viewsService ?? data[0])?.service ?? null
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

</style>