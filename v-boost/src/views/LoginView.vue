<template>
  <main class="min-h-screen flex items-center justify-center px-6">
    <form
      class="w-full max-w-sm bg-white shadow-sm border border-gray-200 rounded-xl p-6 space-y-4"
      @submit.prevent="handleSubmit"
    >
      <h1 class="text-lg font-semibold text-gray-900">Password Check</h1>

      <label class="block text-sm text-gray-700" for="password">Password</label>
      <input
        id="password"
        v-model="passwordInput"
        type="password"
        class="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
        placeholder="Enter password"
        autocomplete="current-password"
      />

      <button
        type="submit"
        :disabled="status === 'loading'"
        class="w-full rounded-md bg-gray-900 text-white py-2 font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
      >
        {{ status === 'loading' ? 'Checking...' : 'Submit' }}
      </button>

      <p v-if="status === 'empty'" class="text-sm text-yellow-600">Please enter a password.</p>
      <p v-else-if="status === 'error'" class="text-sm text-red-700">{{ errorMessage }}</p>
    </form>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AUTH_FLAG } from '../router'

const router = useRouter()
const passwordInput = ref('')
const status = ref('idle')
const errorMessage = ref('')

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
