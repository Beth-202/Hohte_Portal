// composables/useMemberProfile.js
// Profile state for the Telegram Mini App member portal.
//
// - Reads the current locale from useLanguage() so every API call is
//   localized with the right ?lang= value.
// - Options are cached at module scope, one cache per locale, because
//   the API returns label_am/label_en and the `label` field depends on lang.
// - saveSection(name, payload) sends ONE section at a time (the API saves
//   a section whole: fields left out of that section get cleared).
// - On 422, the server's `errors` object (e.g. { "address.sub_city": [...] })
//   is exposed as `lastValidationErrors` AND rethrown so callers can react.
//
// No UI here. This is the data layer the profile page will sit on.

import { ref, computed } from 'vue'
import { useLanguage } from '~/composables/useLanguage'
import { memberProfileService } from '~/services/memberProfile.service'

// ---------------------------------------------------------------------------
// Module-scoped options cache. Keyed by locale because `label` is localized.
// The option lists change rarely, so caching is safe. A language switch
// naturally pulls from the other slot (or refetches once).
// ---------------------------------------------------------------------------
const optionsCache = {
  am: null,
  en: null,
}

export const useMemberProfile = () => {
  const { locale } = useLanguage()

  // ---- state -------------------------------------------------------------
  const profile = ref(null)
  const options = ref(null)
  const changeRequests = ref([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isConfirming = ref(false)
  const error = ref(null)
  const lastValidationErrors = ref(null) // { "address.sub_city": ["..."] } on 422

  // ---- helpers -----------------------------------------------------------
  const currentLang = () => (locale.value === 'en' ? 'en' : 'am')

  const ensureOk = (response) => {
    // The API wraps everything in { data: ... }. The login endpoint returns
    // { status, token, user } instead, but we never call that here.
    return response
  }

  // ---- actions -----------------------------------------------------------

  /**
   * Load the full option lists (or a single list / search result).
   * With no args it loads and caches the full list for the current locale.
   *
   * @param {Object} [params]
   * @param {string} [params.type]  one of: country, city, sub_city,
   *                                education_level, education_field, school,
   *                                spiritual_education, occupation_status,
   *                                skill, availability, department
   * @param {string} [params.q]     search term (for searchable lists)
   * @param {boolean}[params.force] bypass the cache
   */
  const loadOptions = async (params = {}) => {
    const { type, q, force = false } = params
    const lang = currentLang()

    // Full-list path is cacheable. Filtered/searched paths are not.
    const isFullList = !type && !q

    if (isFullList && !force && optionsCache[lang]) {
      options.value = optionsCache[lang]
      return options.value
    }

    try {
      isLoading.value = true
      error.value = null
      const response = await memberProfileService.getOptions({ type, q, lang })

      // Full list -> cache + store. Filtered -> return the slice without
      // clobbering the cached full list.
      if (isFullList) {
        optionsCache[lang] = response.data
        options.value = response.data
        return options.value
      }

      return response.data
    } catch (err) {
      error.value = err.message
      console.error('useMemberProfile.loadOptions failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** GET /member-profile/me */
  const loadProfile = async () => {
    try {
      isLoading.value = true
      error.value = null
      const response = await memberProfileService.getProfile(currentLang())
      profile.value = response.data
      return profile.value
    } catch (err) {
      error.value = err.message
      console.error('useMemberProfile.loadProfile failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * PATCH /member-profile/me with ONE section.
   * Example: saveSection('address', { country: 'ET', sub_city: 'bole', ... })
   *
   * On 422, `lastValidationErrors` holds the per-field map and the error is
   * rethrown so the page can decide what to show.
   * Returns the fresh profile on success.
   */
  const saveSection = async (sectionName, payload) => {
    if (!sectionName) {
      throw new Error('saveSection requires a section name')
    }

    try {
      isSaving.value = true
      error.value = null
      lastValidationErrors.value = null

      const response = await memberProfileService.saveSections(
        { [sectionName]: payload },
        currentLang()
      )

      profile.value = response.data
      return profile.value
    } catch (err) {
      if (err.status === 422 && err.errors) {
        lastValidationErrors.value = err.errors
      } else {
        error.value = err.message
      }
      console.error(`useMemberProfile.saveSection(${sectionName}) failed:`, err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  /** POST /member-profile/me/confirm — "Everything is correct" */
  const confirmProfile = async () => {
    try {
      isConfirming.value = true
      error.value = null
      const response = await memberProfileService.confirmProfile(currentLang())
      profile.value = response.data
      return profile.value
    } catch (err) {
      error.value = err.message
      console.error('useMemberProfile.confirmProfile failed:', err)
      throw err
    } finally {
      isConfirming.value = false
    }
  }

  /** GET /member-profile/me/change-requests */
  const loadChangeRequests = async () => {
    try {
      isLoading.value = true
      error.value = null
      const response = await memberProfileService.getChangeRequests(currentLang())
      changeRequests.value = Array.isArray(response.data) ? response.data : []
      return changeRequests.value
    } catch (err) {
      error.value = err.message
      console.error('useMemberProfile.loadChangeRequests failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ---- derived helpers ---------------------------------------------------

  /**
   * pending_changes entries for a given field name (e.g. "first_name").
   * Always read this instead of hard-coding which fields are gated.
   */
  const getPendingFor = (fieldName) => {
    const list = profile.value?.pending_changes
    if (!Array.isArray(list)) return null
    return list.find((pc) => pc.field === fieldName) || null
  }

  /**
   * The newest rejected change request for a given field, if any.
   * Used to show "Rejected: <review_note>" under the field.
   */
  const getLatestRejectionFor = (fieldName) => {
    const list = changeRequests.value
    if (!Array.isArray(list) || list.length === 0) return null
    // The API returns newest first, so the first match is the latest.
    return (
      list.find((cr) => cr.field === fieldName && cr.status === 'rejected') ||
      null
    )
  }

  const hasPendingChanges = computed(() => {
    const list = profile.value?.pending_changes
    return Array.isArray(list) && list.length > 0
  })

  const isImported = computed(() => profile.value?.status === 'imported')
  const isConfirmed = computed(() => profile.value?.status === 'confirmed')

  return {
    // state
    profile,
    options,
    changeRequests,
    isLoading,
    isSaving,
    isConfirming,
    error,
    lastValidationErrors,

    // derived
    hasPendingChanges,
    isImported,
    isConfirmed,

    // actions
    loadOptions,
    loadProfile,
    saveSection,
    confirmProfile,
    loadChangeRequests,

    // helpers
    getPendingFor,
    getLatestRejectionFor,
  }
}