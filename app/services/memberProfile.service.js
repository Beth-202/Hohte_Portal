// services/memberProfile.service.js
// Thin wrapper around apiService.request() for the member profile endpoints.
// Adds the ?lang= query param to every call so labels come back localized.
// The member always comes from the token; no endpoint here takes a user id.

import { apiService } from '~/services/api.service'

const BASE = '/api/v1/member-profile'

// Build a query string from a plain object, dropping null/undefined/'' values.
const buildQuery = (params = {}) => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      usp.append(key, value)
    }
  })
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

export class MemberProfileService {
  /**
   * GET /api/v1/member-profile/options
   * - no args          -> every list in one call
   * - { type }         -> one list only
   * - { type, q }      -> search inside one list
   * Returns the raw response body: { data: { <type>: [ ... ] } }
   */
  async getOptions({ type, q, lang = 'am' } = {}) {
    const endpoint = `${BASE}/options${buildQuery({ type, q, lang })}`
    return apiService.request(endpoint)
  }

  /**
   * GET /api/v1/member-profile/me
   * Returns { data: { status, personal, address, ... } }
   */
  async getProfile(lang = 'am') {
    const endpoint = `${BASE}/me${buildQuery({ lang })}`
    return apiService.request(endpoint)
  }

  /**
   * PATCH /api/v1/member-profile/me
   * `sections` is an object like { address: {...} } or { work: {...}, skills: {...} }.
   * Every section is saved WHOLE: fields left out of that section are cleared.
   * Returns the full profile, same shape as getProfile().
   */
  async saveSections(sections, lang = 'am') {
    const endpoint = `${BASE}/me${buildQuery({ lang })}`
    return apiService.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(sections),
    })
  }

  /**
   * POST /api/v1/member-profile/me/confirm
   * "Everything is correct" without changes. Sets status to confirmed.
   * Returns the full profile.
   */
  async confirmProfile(lang = 'am') {
    const endpoint = `${BASE}/me/confirm${buildQuery({ lang })}`
    return apiService.request(endpoint, { method: 'POST' })
  }

  /**
   * GET /api/v1/member-profile/me/change-requests
   * Returns { data: [ { id, field, field_label, old_value, new_value,
   *                      status, review_note, requested_at, reviewed_at }, ... ] }
   */
  async getChangeRequests(lang = 'am') {
    const endpoint = `${BASE}/me/change-requests${buildQuery({ lang })}`
    return apiService.request(endpoint)
  }
}

export const memberProfileService = new MemberProfileService()