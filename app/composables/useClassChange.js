// composables/useClassChange.js
// State for the class-change feature. Reads the current locale via useLanguage()
// so every call is localized with the right ?lang= value.
//
// No UI here. This is the data layer the class-change page will sit on.

import { ref, computed } from 'vue'
import { useLanguage } from '~/composables/useLanguage'
import { classChangeService } from '~/services/classChange.service'

export const useClassChange = () => {
  const { locale } = useLanguage()

  // ---- state ----
  const options = ref(null)             // { min_choices, max_choices, ... }
  const requests = ref([])              // array of request objects
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const isCancelling = ref(false)
  const error = ref(null)
  const lastValidationErrors = ref(null) // 422 per-field map, e.g. { "choices.1": [...] }

  // ---- helpers ----
  const currentLang = () => (locale.value === 'en' ? 'en' : 'am')

  // ---- actions ----

  /** GET /class-change/options */
  const loadOptions = async () => {
    try {
      isLoading.value = true
      error.value = null
      const response = await classChangeService.getOptions(currentLang())
      options.value = response.data || null
      return options.value
    } catch (err) {
      error.value = err.message
      console.error('useClassChange.loadOptions failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** GET /class-change/requests */
  const loadRequests = async () => {
    try {
      isLoading.value = true
      error.value = null
      const response = await classChangeService.getRequests(currentLang())
      requests.value = Array.isArray(response.data) ? response.data : []
      return requests.value
    } catch (err) {
      error.value = err.message
      console.error('useClassChange.loadRequests failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** Convenience: load both options and requests in parallel. */
  const loadAll = async () => {
    await Promise.all([loadOptions(), loadRequests()])
  }

  /**
   * POST /class-change/requests
   * @param {Object} payload
   * @param {number[]} payload.choices       ordered list of department ids
   * @param {string}   [payload.reason]
   * @param {number}   [payload.from_department_id]  required only when >1 current dept
   */
  const submitRequest = async (payload) => {
    try {
      isSubmitting.value = true
      error.value = null
      lastValidationErrors.value = null
      const response = await classChangeService.submitRequest(payload, currentLang())
      // Refresh the request list + options (has_open_request now flips to true)
      await Promise.all([loadRequests(), loadOptions()]).catch(() => {})
      return response.data
    } catch (err) {
      if (err.status === 422 && err.errors) {
        lastValidationErrors.value = err.errors
      } else {
        error.value = err.message
      }
      console.error('useClassChange.submitRequest failed:', err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /** DELETE /class-change/requests/{id} */
  const cancelRequest = async (id) => {
    try {
      isCancelling.value = true
      error.value = null
      await classChangeService.cancelRequest(id, currentLang())
      await Promise.all([loadRequests(), loadOptions()]).catch(() => {})
      return true
    } catch (err) {
      error.value = err.message
      console.error('useClassChange.cancelRequest failed:', err)
      throw err
    } finally {
      isCancelling.value = false
    }
  }

  // ---- derived ----

  const minChoices = computed(() => options.value?.min_choices ?? 0)
  const maxChoices = computed(() => options.value?.max_choices ?? 0)

  const currentDepartments = computed(() => {
    const list = options.value?.current_departments
    return Array.isArray(list) ? list : []
  })

  const availableDepartments = computed(() => {
    const list = options.value?.available_departments
    return Array.isArray(list) ? list : []
  })

  const hasOpenRequest = computed(() => !!options.value?.has_open_request)

  const pendingRequest = computed(() =>
    requests.value.find((r) => r.status === 'pending') || null
  )

  /** How many from_department dropdowns to show: only when >1 current dept. */
  const needsFromDepartment = computed(() => currentDepartments.value.length > 1)

  /** Field error lookup for keys like "choices.1". */
  const fieldError = (key) => {
    const map = lastValidationErrors.value
    if (!map) return ''
    const arr = map[key]
    return Array.isArray(arr) && arr.length ? arr[0] : ''
  }

  return {
    // state
    options,
    requests,
    isLoading,
    isSubmitting,
    isCancelling,
    error,
    lastValidationErrors,

    // derived
    minChoices,
    maxChoices,
    currentDepartments,
    availableDepartments,
    hasOpenRequest,
    pendingRequest,
    needsFromDepartment,

    // actions
    loadOptions,
    loadRequests,
    loadAll,
    submitRequest,
    cancelRequest,

    // helpers
    fieldError,
  }
}