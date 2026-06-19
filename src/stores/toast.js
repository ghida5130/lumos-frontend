import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const DEFAULT_DURATION = 3000
const MAX_TOAST_COUNT = 3

let nextToastId = 1

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  const timers = new Map()

  const visibleToasts = computed(() => toasts.value)

  function remove(id) {
    const timer = timers.get(id)

    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }

    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function show(message, options = {}) {
    if (!message) {
      return null
    }

    const id = nextToastId++
    const duration = options.duration ?? DEFAULT_DURATION

    const toast = {
      id,
      message,
      type: options.type ?? 'info',
      title: options.title ?? '',
    }

    const nextToasts = [...toasts.value, toast].slice(-MAX_TOAST_COUNT)
    const activeIds = new Set(nextToasts.map((activeToast) => activeToast.id))

    timers.forEach((timer, timerId) => {
      if (!activeIds.has(timerId)) {
        clearTimeout(timer)
        timers.delete(timerId)
      }
    })

    toasts.value = nextToasts

    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => {
          remove(id)
        }, duration),
      )
    }

    return id
  }

  function success(message, options = {}) {
    return show(message, { ...options, type: 'success' })
  }

  function error(message, options = {}) {
    return show(message, { ...options, type: 'error' })
  }

  function warning(message, options = {}) {
    return show(message, { ...options, type: 'warning' })
  }

  function info(message, options = {}) {
    return show(message, { ...options, type: 'info' })
  }

  function clear() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    toasts.value = []
  }

  return {
    toasts: visibleToasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  }
})
