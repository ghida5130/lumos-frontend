import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  const currentError = ref(null)

  function setError(error) {
    currentError.value = error
  }

  function clearError() {
    currentError.value = null
  }

  return {
    currentError,
    setError,
    clearError,
  }
})
