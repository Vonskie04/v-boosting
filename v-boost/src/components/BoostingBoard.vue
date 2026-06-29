<template>
  <div class="flex-1 w-full px-2 py-3 sm:px-6 sm:py-7">
    <div class="board-shell mx-auto w-full max-w-6xl rounded-[22px] border border-[#d7e2f3] p-3 shadow-[0_30px_70px_rgba(23,57,110,0.18)] sm:rounded-[30px] sm:p-7">
      <div class="board-glow board-glow-left"></div>
      <div class="board-glow board-glow-right"></div>

      <div class="relative z-10 flex flex-col gap-4">
        <div>
          <div class="flex items-start justify-between gap-3">
            <p class="header-kicker pt-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#617999]">order control</p>

            <div class="relative shrink-0">
              <button
                type="button"
                @click="toggleBalance"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e2f2] bg-white/95 px-3 py-2 text-xs font-semibold text-[#415a80] shadow-sm transition-colors hover:bg-white hover:text-[#1f3150] sm:px-4 sm:text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M16 12h.01"/>
                  <path d="M2 10h20"/>
                </svg>
                <svg :class="balanceOpen ? 'rotate-180' : ''"
                  class="transition-transform duration-200"
                  xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              <transition name="balance-dropdown">
                <div
                  v-if="balanceOpen"
                  class="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#d8e2f2] bg-white p-4 shadow-[0_18px_44px_rgba(27,57,102,0.2)]"
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
                    <p v-if="balanceCurrency === 'USD' && hasUsdRate" class="text-[11px] text-[#6a7f9f]">1 EUR = {{ usdRate.toFixed(4) }} USD <span v-if="usdRateStatusLabel">({{ usdRateStatusLabel }})</span></p>
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

          <div>
            <h2 class="mt-2 text-xl font-extrabold text-[#1b2e4a] sm:text-3xl">Boosting Board</h2>
            <p class="mt-2 max-w-xl text-sm text-[#526885]">
              Browse every platform, narrow by service type, and place an order with the right link and quantity.
            </p>
          </div>
        </div>

        <div class="stats-grid grid grid-cols-3 gap-2 sm:gap-3">
          <div class="stat-tile">
            <p class="stat-label">Total services</p>
            <p class="stat-value">{{ services.length }}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-label">Platforms</p>
            <p class="stat-value">{{ platformCount }}</p>
          </div>
          <div class="stat-tile">
            <p class="stat-label">Service types</p>
            <p class="stat-value">{{ serviceTypeCount }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-[#d6e1f1] bg-white/90 p-3 sm:rounded-3xl sm:p-6">
          <div class="mb-5 space-y-3">
            <div class="chip-rail">
              <button
                v-for="platform in platformOptions"
                :key="platform.value"
                type="button"
                @click="setSelectedPlatform(platform.value)"
                :disabled="loading || servicesLoading"
                class="platform-chip"
                :class="selectedPlatform === platform.value
                  ? 'border-[#145fc9] bg-[#145fc9] text-white shadow-[0_10px_20px_rgba(20,95,201,0.28)]'
                  : 'border-[#d2deee] bg-white text-[#4f6688] hover:border-[#b6cae6] hover:bg-[#f2f7ff]'"
              >
                <span>{{ platform.label }}</span>
                <span class="chip-count" :class="selectedPlatform === platform.value ? 'bg-white/20 text-white' : 'bg-[#edf4ff] text-[#587198]'">{{ platform.count }}</span>
              </button>
            </div>

            <div class="chip-rail">
              <button
                v-for="type in serviceTypeOptions"
                :key="type.value"
                type="button"
                @click="setSelectedServiceType(type.value)"
                :disabled="loading || servicesLoading"
                class="type-chip rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                :class="selectedServiceType === type.value
                  ? 'border-[#1e6b66] bg-[#1e6b66] text-white shadow-[0_8px_18px_rgba(30,107,102,0.18)]'
                  : 'border-[#d2deee] bg-[#f8fbff] text-[#546b8e] hover:border-[#b6cae6] hover:bg-white'"
              >
                {{ type.label }} <span class="opacity-75">{{ type.count }}</span>
              </button>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div class="service-column space-y-4">
              <div class="space-y-2 text-left">
                <label for="service-search" class="text-sm font-semibold text-[#23344f]">Find service</label>
                <input
                  id="service-search"
                  v-model="serviceSearch"
                  type="text"
                  placeholder="Search by service name or category"
                  class="service-input w-full rounded-xl border border-[#cfdceb] bg-white px-4 py-3 focus:border-[#3b78da] focus:outline-none focus:ring-4 focus:ring-[#3b78da]/15"
                  :disabled="loading || servicesLoading"
                />
              </div>

              <div class="space-y-2 text-left">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <label for="service" class="text-sm font-semibold text-[#23344f]">Service list</label>
                  <button
                    type="button"
                    @click="loadServices"
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

                <div v-if="!servicesLoading && filteredServices.length" id="service" class="service-list">
                  <section v-for="group in groupedFilteredServices" :key="group.value" class="service-group">
                    <div class="service-group-heading">
                      <span>{{ group.label }}</span>
                      <span>{{ group.items.length }}</span>
                    </div>
                    <button
                      v-for="svc in group.items"
                      :key="svc.service"
                      type="button"
                      class="service-row"
                      :class="String(selectedService) === String(svc.service) ? 'service-row-active' : ''"
                      :disabled="loading"
                      @click="handleServiceClick(svc)"
                      @pointerdown="beginServiceHold(svc, $event)"
                      @pointermove="moveServiceHold"
                      @pointerup="cancelServiceHold"
                      @pointerleave="cancelServiceHold"
                      @pointercancel="cancelServiceHold"
                      @contextmenu.prevent="openServiceModal(svc)"
                    >
                      <span class="service-row-copy min-w-0">
                        <span class="service-name block text-sm font-bold text-[#1d314f]">{{ svc.name }}</span>
                        <span class="service-meta mt-1 block text-xs text-[#627895]">
                          {{ svc.platformLabel }} / {{ svc.typeLabel }} / #{{ svc.service }}
                        </span>
                      </span>
                      <span class="shrink-0 text-right">
                        <span class="block text-xs font-bold text-[#145fc9]">{{ formatRateLabel(svc) }}</span>
                        <span class="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a8ca7]">per 1k</span>
                      </span>
                    </button>
                  </section>
                </div>
                <div v-else-if="servicesLoading" class="px-1 text-sm text-[#6a7f9f]">Loading services...</div>
                <div v-else-if="servicesError" class="px-1 text-sm text-rose-600">Could not load services. Is the server running?</div>
                <div v-else class="px-1 text-sm text-[#6a7f9f]">No services found for this filter.</div>
              </div>
            </div>

            <div
              class="service-preview"
              @pointerdown="selectedServiceData && beginServiceHold(selectedServiceData, $event)"
              @pointermove="moveServiceHold"
              @pointerup="cancelServiceHold"
              @pointerleave="cancelServiceHold"
              @pointercancel="cancelServiceHold"
              @contextmenu.prevent="selectedServiceData && openServiceModal(selectedServiceData)"
            >
              <div class="service-preview-header flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-bold uppercase tracking-[0.24em] text-[#6c81a0]">Selected service</p>
                  <p class="mt-2 text-lg font-bold text-[#1b2f4c]">{{ selectedServiceData?.name || 'Pick a service' }}</p>
                  <p class="mt-1 text-sm text-[#5f7493]">{{ selectedServiceData?.platformLabel || 'Platform unavailable' }} / {{ selectedServiceData?.typeLabel || 'Type unavailable' }}</p>
                </div>
                <button
                  v-if="selectedServiceData"
                  type="button"
                  class="rounded-lg border border-[#cfdceb] bg-white px-3 py-1.5 text-xs font-semibold text-[#4f6485] transition-colors hover:bg-[#edf3fd]"
                  @click.stop="openServiceModal(selectedServiceData)"
                >
                  Details
                </button>
              </div>
              <p v-if="selectedServiceData" class="mt-3 text-sm leading-6 text-[#516987]">{{ selectedServiceDescription }}</p>
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
              <div class="quantity-presets flex flex-wrap gap-2">
                <button
                  v-for="preset in [500, 1000, 5000]"
                  :key="preset"
                  type="button"
                  @click="setPresetQuantity(preset)"
                  :disabled="loading"
                  class="quantity-button rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
                  :class="!showCustomQuantity && quantity === preset ? 'border-[#145fc9] bg-[#145fc9] text-white' : 'border-[#cfdceb] bg-white text-[#4b6388] hover:bg-[#edf3fd]'"
                >
                  {{ preset }}
                </button>
                <button
                  type="button"
                  @click="showCustomQuantity = !showCustomQuantity"
                  :disabled="loading"
                  class="quantity-button rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
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
                  class="rounded-xl border border-[#cfdceb] bg-white px-4 py-2.5 text-sm font-semibold text-[#4f6485] hover:bg-[#edf3fd] sm:w-auto"
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

    <Teleport to="body">
      <transition name="service-modal">
        <div
          v-if="serviceModalOpen"
          class="fixed inset-0 z-50 flex items-end justify-center bg-[#13233c]/45 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          @click="closeServiceModal"
        >
          <div
            class="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d6e1f1] bg-white p-4 shadow-[0_28px_80px_rgba(12,31,62,0.28)] sm:p-6"
            @click.stop
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6c81a0]">{{ serviceModalData?.platformLabel }} / {{ serviceModalData?.typeLabel }}</p>
                <h3 class="mt-2 text-lg font-extrabold leading-snug text-[#1b2e4a] sm:text-xl">{{ serviceModalData?.name }}</h3>
              </div>
              <button
                type="button"
                class="rounded-lg border border-[#d8e2f2] bg-white p-2 text-[#536985] transition-colors hover:bg-[#eef3fb]"
                @click="closeServiceModal"
                aria-label="Close service details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <p class="mt-4 text-sm leading-6 text-[#516987]">{{ serviceModalDescription }}</p>

            <div class="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div class="mini-stat">
                <span class="mini-label">Service ID</span>
                <span class="mini-value">#{{ serviceModalData?.service ?? '-' }}</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">Rate / 1k</span>
                <span class="mini-value">{{ formatRateLabel(serviceModalData) }}</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">Minimum</span>
                <span class="mini-value">{{ serviceModalData?.min ?? '-' }}</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">Maximum</span>
                <span class="mini-value">{{ serviceModalData?.max ?? '-' }}</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">Refill</span>
                <span class="mini-value">{{ serviceModalData?.refill ? 'Yes' : 'No' }}</span>
              </div>
              <div class="mini-stat">
                <span class="mini-label">Cancel</span>
                <span class="mini-value">{{ serviceModalData?.cancel ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'

const platformRules = [
  { label: 'TikTok', value: 'tiktok', tokens: ['tiktok', 'tik tok'] },
  { label: 'Instagram', value: 'instagram', tokens: ['instagram', 'insta', 'ig '] },
  { label: 'YouTube', value: 'youtube', tokens: ['youtube', 'youtu.be', 'yt '] },
  { label: 'Facebook', value: 'facebook', tokens: ['facebook', 'fb '] },
  { label: 'X/Twitter', value: 'twitter', tokens: ['twitter', ' x ', 'x.com'] },
  { label: 'Telegram', value: 'telegram', tokens: ['telegram', 't.me'] },
  { label: 'Spotify', value: 'spotify', tokens: ['spotify'] },
  { label: 'Twitch', value: 'twitch', tokens: ['twitch'] },
  { label: 'Discord', value: 'discord', tokens: ['discord'] },
  { label: 'Website', value: 'website', tokens: ['website', 'traffic', 'seo', 'google'] },
]

const serviceTypeRules = [
  { label: 'Views', value: 'views', tokens: ['view', 'views', 'play', 'plays', 'impression', 'watch time'] },
  { label: 'Followers', value: 'followers', tokens: ['follower', 'followers', 'subscriber', 'subscribers', 'member', 'members'] },
  { label: 'Likes', value: 'likes', tokens: ['like', 'likes', 'reaction', 'reactions'] },
  { label: 'Comments', value: 'comments', tokens: ['comment', 'comments', 'reply', 'replies'] },
  { label: 'Shares', value: 'shares', tokens: ['share', 'shares', 'repost', 'retweet'] },
  { label: 'Saves', value: 'saves', tokens: ['save', 'saves', 'favorite', 'favorites'] },
  { label: 'Live', value: 'live', tokens: ['live', 'stream'] },
  { label: 'Story', value: 'story', tokens: ['story', 'stories', 'reel', 'reels', 'short', 'shorts'] },
  { label: 'Watch Time', value: 'watch-time', tokens: ['watch hour', 'watch hours', 'watchtime', 'retention'] },
  { label: 'Traffic', value: 'traffic', tokens: ['traffic', 'visit', 'visits', 'click', 'clicks'] },
]

// Balance
const balanceOpen = ref(false)
const balanceLoading = ref(false)
const balanceError = ref('')
const balance = ref(null)
const balanceCurrency = ref('EUR')
const usdRate = ref(null)
const usdRateUpdatedAt = ref(null)

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

const selectedPlatform = ref('all')
const selectedServiceType = ref('all')
const services = ref([])
const selectedService = ref(null)
const servicesLoading = ref(false)
const servicesError = ref(false)
const serviceSearch = ref('')
const serviceModalOpen = ref(false)
const serviceModalData = ref(null)

const showCustomQuantity = ref(false)
const customQuantity = ref(null)

const platformFilteredServices = computed(() => {
  if (selectedPlatform.value === 'all') return services.value
  return services.value.filter(svc => svc.platform === selectedPlatform.value)
})

const filteredServices = computed(() => {
  const term = serviceSearch.value.trim().toLowerCase()
  const byType = selectedServiceType.value === 'all'
    ? platformFilteredServices.value
    : platformFilteredServices.value.filter(svc => svc.serviceType === selectedServiceType.value)

  if (!term) return byType

  return byType.filter(svc => {
    const haystack = `${svc.name ?? ''} ${svc.category ?? ''} ${svc.platformLabel ?? ''} ${svc.typeLabel ?? ''}`.toLowerCase()
    return haystack.includes(term)
  })
})

const groupedFilteredServices = computed(() => {
  const groups = new Map()
  filteredServices.value.forEach(svc => {
    const key = svc.serviceType || 'other'
    if (!groups.has(key)) {
      groups.set(key, {
        value: key,
        label: svc.typeLabel || 'Other',
        items: [],
      })
    }
    groups.get(key).items.push(svc)
  })

  return [...groups.values()]
})

const selectedServiceData = computed(() =>
  services.value.find(item => String(item.service) === String(selectedService.value)) || null
)

const platformCount = computed(() => {
  const keys = new Set(
    services.value
      .map(item => item.platform)
      .filter(Boolean)
  )
  return keys.size
})

const serviceTypeCount = computed(() => {
  const keys = new Set(
    services.value
      .map(item => item.serviceType)
      .filter(Boolean)
  )
  return keys.size
})

const platformOptions = computed(() => {
  const counts = countBy(services.value, 'platform')
  const options = [
    { label: 'All Platforms', value: 'all', count: services.value.length },
    ...platformRules
      .filter(rule => counts.get(rule.value))
      .map(rule => ({ label: rule.label, value: rule.value, count: counts.get(rule.value) })),
  ]

  if (counts.get('other')) {
    options.push({ label: 'Other', value: 'other', count: counts.get('other') })
  }

  return options
})

const serviceTypeOptions = computed(() => {
  const counts = countBy(platformFilteredServices.value, 'serviceType')
  const options = [
    { label: 'All Types', value: 'all', count: platformFilteredServices.value.length },
    ...serviceTypeRules
      .filter(rule => counts.get(rule.value))
      .map(rule => ({ label: rule.label, value: rule.value, count: counts.get(rule.value) })),
  ]

  if (counts.get('other')) {
    options.push({ label: 'Other', value: 'other', count: counts.get('other') })
  }

  return options
})

const selectedServiceRateLabel = computed(() => {
  return formatRateLabel(selectedServiceData.value)
})

const platformName = computed(() => {
  return selectedServiceData.value?.platformLabel || 'Social'
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
    Twitch: 'https://www.twitch.tv/...',
    Discord: 'https://discord.gg/...',
    Website: 'https://example.com/...',
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

const selectedServiceDescription = computed(() => buildServiceDescription(selectedServiceData.value))

const serviceModalDescription = computed(() => buildServiceDescription(serviceModalData.value))

const usdRateStatusLabel = computed(() => {
  if (!hasUsdRate.value || !usdRateUpdatedAt.value) return ''
  return `Updated ${new Date(usdRateUpdatedAt.value).toLocaleTimeString()}`
})

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

function countBy(items, key) {
  const counts = new Map()
  items.forEach(item => {
    const value = item?.[key] || 'other'
    counts.set(value, (counts.get(value) || 0) + 1)
  })
  return counts
}

function serviceText(service) {
  return ` ${service?.name ?? ''} ${service?.category ?? ''} ${service?.type ?? ''} `.toLowerCase()
}

function classifyFromRules(service, rules) {
  const text = serviceText(service)
  return rules.find(rule => rule.tokens.some(token => text.includes(token))) || null
}

function enrichService(service) {
  const platform = classifyFromRules(service, platformRules)
  const type = classifyFromRules(service, serviceTypeRules)

  return {
    ...service,
    platform: platform?.value || 'other',
    platformLabel: platform?.label || 'Other',
    serviceType: type?.value || 'other',
    typeLabel: type?.label || 'Other',
  }
}

function buildServiceDescription(service) {
  if (!service) return ''

  const platform = service.platformLabel || 'selected platform'
  const type = (service.typeLabel || 'service').toLowerCase()
  const min = service.min ?? '-'
  const max = service.max ?? '-'
  const refill = service.refill ? 'includes refill support' : 'does not include refill support'
  const cancel = service.cancel ? 'can be cancelled when supported upstream' : 'does not advertise cancellation'

  return `${service.name} is a ${platform} ${type} service. Orders accept quantities from ${min} to ${max}, ${refill}, and ${cancel}. Use a matching ${platform} link for the best chance of a clean submission.`
}

function formatRateLabel(service) {
  const raw = Number.parseFloat(service?.rate)
  if (!Number.isFinite(raw)) return '-'

  if (balanceCurrency.value === 'USD') {
    if (!hasUsdRate.value) return 'N/A USD'
    return `${(raw * usdRate.value).toFixed(2)} USD`
  }

  return `${raw.toFixed(2)} EUR`
}

async function fetchBalance() {
  balanceLoading.value = true
  balanceError.value = ''
  try {
    const balRes = await fetch('/api/balance')
    if (!balRes.ok) throw new Error('Bad response from balance API')
    const data = await balRes.json()
    if (data.error) throw new Error(data.error)

    const eurAmount = parseFloat(data.balance)
    if (!Number.isFinite(eurAmount)) {
      throw new Error('Invalid balance response')
    }

    balance.value = eurAmount
    await fetchUsdRate(true)
  } catch (err) {
    balanceError.value = err.message || 'Failed to load balance.'
  } finally {
    balanceLoading.value = false
  }
}

async function fetchUsdRate(showError = false) {
  const providers = [
    async () => {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR')
      if (!res.ok) throw new Error('FX provider 1 failed')
      const data = await res.json()
      return Number(data?.rates?.USD)
    },
    async () => {
      const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD')
      if (!res.ok) throw new Error('FX provider 2 failed')
      const data = await res.json()
      return Number(data?.rates?.USD)
    },
  ]

  for (const getRate of providers) {
    try {
      const rate = await getRate()
      if (Number.isFinite(rate) && rate > 0) {
        usdRate.value = rate
        usdRateUpdatedAt.value = Date.now()
        return rate
      }
    } catch {
      // Try next provider.
    }
  }

  if (showError) {
    balanceError.value = 'Live USD conversion is currently unavailable.'
  }
  usdRate.value = null
  usdRateUpdatedAt.value = null
  return null
}

function setBalanceCurrency(currency) {
  balanceCurrency.value = currency
}

let fxRefreshTimer = null

function startUsdRateRefresh() {
  stopUsdRateRefresh()
  fxRefreshTimer = setInterval(() => {
    fetchUsdRate(false)
  }, 30000)
}

function stopUsdRateRefresh() {
  if (!fxRefreshTimer) return
  clearInterval(fxRefreshTimer)
  fxRefreshTimer = null
}

function toggleBalance() {
  balanceOpen.value = !balanceOpen.value
  if (balanceOpen.value) {
    if (balance.value === null && !balanceLoading.value) {
      fetchBalance()
    } else {
      fetchUsdRate(false)
    }
    startUsdRateRefresh()
  } else {
    stopUsdRateRefresh()
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

function setSelectedPlatform(value) {
  selectedPlatform.value = value
  selectedServiceType.value = 'all'
}

function setSelectedServiceType(value) {
  selectedServiceType.value = value
}

function selectService(serviceId) {
  selectedService.value = serviceId
  error.value = ''
}

let serviceHoldTimer = null
const serviceHoldState = {
  service: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  suppressNextClick: false,
}
const serviceHoldMoveTolerance = 10

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
}

function shouldUseServiceHold(event) {
  return isMobileViewport() && event?.pointerType !== 'mouse'
}

function handleServiceClick(service) {
  if (serviceHoldState.suppressNextClick) {
    serviceHoldState.suppressNextClick = false
    return
  }
  selectService(service.service)
}

function beginServiceHold(service, event) {
  if (!service || loading.value || servicesLoading.value) return
  if (!shouldUseServiceHold(event)) return

  cancelServiceHold()
  serviceHoldState.service = service
  serviceHoldState.pointerId = event.pointerId
  serviceHoldState.startX = event.clientX
  serviceHoldState.startY = event.clientY
  serviceHoldTimer = setTimeout(() => {
    serviceHoldTimer = null
    serviceHoldState.suppressNextClick = true
    openServiceModal(service)
  }, 650)
}

function moveServiceHold(event) {
  if (!serviceHoldTimer || event.pointerId !== serviceHoldState.pointerId) return

  const movedX = Math.abs(event.clientX - serviceHoldState.startX)
  const movedY = Math.abs(event.clientY - serviceHoldState.startY)
  if (movedX > serviceHoldMoveTolerance || movedY > serviceHoldMoveTolerance) {
    cancelServiceHold()
  }
}

function cancelServiceHold() {
  if (serviceHoldTimer) {
    clearTimeout(serviceHoldTimer)
  }
  serviceHoldTimer = null
  serviceHoldState.service = null
  serviceHoldState.pointerId = null
}

function openServiceModal(service = selectedServiceData.value) {
  cancelServiceHold()
  if (!service) return
  serviceModalData.value = service
  serviceModalOpen.value = true
}

function closeServiceModal() {
  cancelServiceHold()
  serviceModalOpen.value = false
  serviceModalData.value = null
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

function normalizeSocialUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

async function loadServices() {
  servicesLoading.value = true
  servicesError.value = false
  services.value = []
  selectedService.value = null

  try {
    const res = await fetch('/api/services?filter=all')
    if (!res.ok) throw new Error('Bad response')
    const data = await res.json()

    const selectable = Array.isArray(data)
      ? data.filter(item => /^\d+$/.test(String(item?.service ?? '')))
        .map(enrichService)
      : []

    services.value = selectable

    const viewsService = selectable.find(s => s.platform === 'tiktok' && s.serviceType === 'views')
      || selectable.find(s => s.serviceType === 'views')
    selectedService.value = (viewsService ?? selectable[0])?.service ?? null
  } catch {
    servicesError.value = true
  } finally {
    servicesLoading.value = false
  }
}

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

watch(selectedPlatform, platform => {
  if (platformOptions.value.some(item => item.value === platform)) return
  selectedPlatform.value = 'all'
})

watch(serviceTypeOptions, options => {
  if (options.some(item => item.value === selectedServiceType.value)) return
  selectedServiceType.value = 'all'
})

onUnmounted(() => {
  stopUsdRateRefresh()
  cancelServiceHold()
})

loadServices()

async function submitBoost() {
  error.value = ''
  orderId.value = null
  loading.value = true

  try {
    const normalizedUrl = normalizeSocialUrl(url.value)
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
  touch-action: manipulation;
}

.service-column,
.service-input {
  min-width: 0;
}

.platform-chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
  border-width: 1px;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.chip-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-chip {
  flex: 0 0 auto;
}

.chip-count {
  min-width: 24px;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 800;
}

.service-list {
  max-height: 420px;
  overflow: auto;
  padding-right: 4px;
}

.service-group + .service-group {
  margin-top: 14px;
}

.service-group-heading {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  border: 1px solid #d9e4f3;
  border-radius: 10px;
  background: rgba(247, 251, 255, 0.96);
  padding: 7px 10px;
  color: #5f7493;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.service-row {
  display: flex;
  width: 100%;
  max-width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #d4e0f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 11px 12px;
  text-align: left;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  touch-action: manipulation;
}

.service-row-copy {
  flex: 1 1 auto;
  max-width: 100%;
}

.service-name {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.service-meta {
  overflow-wrap: anywhere;
}

.service-row + .service-row {
  margin-top: 8px;
}

.service-row:hover {
  border-color: #adc4e5;
  background: #f8fbff;
}

.service-row-active {
  border-color: #145fc9;
  background: #eef6ff;
  box-shadow: 0 10px 24px rgba(20, 95, 201, 0.14);
}

.quantity-button {
  min-height: 40px;
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

.service-modal-enter-active,
.service-modal-leave-active {
  transition: opacity 0.18s ease;
}

.service-modal-enter-active > div,
.service-modal-leave-active > div {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.service-modal-enter-from,
.service-modal-leave-to {
  opacity: 0;
}

.service-modal-enter-from > div,
.service-modal-leave-to > div {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .header-kicker {
    letter-spacing: 0.18em;
  }

  .board-shell {
    box-shadow: 0 18px 46px rgba(23, 57, 110, 0.14);
  }

  .board-glow {
    opacity: 0.45;
  }

  .board-glow-left {
    left: -170px;
    top: -150px;
  }

  .board-glow-right {
    right: -180px;
    top: 90px;
  }

  .stats-grid {
    align-items: stretch;
  }

  .stat-tile {
    border-radius: 12px;
    padding: 10px 8px;
    min-width: 0;
  }

  .stat-label {
    font-size: 9px;
    letter-spacing: 0.08em;
    line-height: 1.25;
    min-height: 24px;
  }

  .stat-value {
    margin-top: 4px;
    font-size: 21px;
  }

  .chip-rail {
    flex-wrap: nowrap;
    margin-inline: -12px;
    overflow-x: auto;
    padding: 0 12px 3px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .chip-rail::-webkit-scrollbar {
    display: none;
  }

  .platform-chip {
    padding: 8px 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  .type-chip {
    white-space: nowrap;
  }

  .service-list {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .service-group-heading {
    border-radius: 9px;
    font-size: 10px;
    letter-spacing: 0.08em;
  }

  .service-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    max-width: 100%;
    padding: 10px;
  }

  .service-row-copy {
    width: 100%;
  }

  .service-name {
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .service-row > span:last-child {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }

  .service-preview {
    display: none;
  }

  .service-preview-header {
    align-items: stretch;
    flex-direction: column;
  }

  .mini-stat {
    min-width: 0;
    padding: 8px;
  }

  .mini-value {
    overflow-wrap: anywhere;
  }

  .quantity-presets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quantity-button {
    width: 100%;
  }
}
</style>
