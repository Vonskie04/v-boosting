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
        class="w-full rounded-md bg-gray-900 text-white py-2 font-medium hover:bg-gray-800 transition-colors"
      >
        Submit
      </button>

      <p v-if="status === 'empty'" class="text-sm text-yellow-600">Please enter a password.</p>
      <p v-else-if="status === 'error'" class="text-sm text-red-700">Incorrect password.</p>
    </form>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AUTH_FLAG } from '../router'

const CORRECT_PASSWORD = 'Jvon$_2134'

const router = useRouter()
const passwordInput = ref('')
const status = ref('idle')

function handleSubmit() {
  if (!passwordInput.value.trim()) {
    status.value = 'empty'
    return
  }

  if (passwordInput.value === CORRECT_PASSWORD) {
    sessionStorage.setItem(AUTH_FLAG, 'true')
    router.push({ name: 'dashboard' })
    return
  }

  status.value = 'error'
}
</script>
