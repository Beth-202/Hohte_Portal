// services/classChange.service.js
// Thin wrapper around apiService.request() for the class-change endpoints.
// Adds ?lang= to every call and returns the raw response body.

import { apiService } from '~/services/api.service'

const BASE = '/api/v1/class-change'

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

export class ClassChangeService {
  /**
   * GET /api/v1/class-change/options
   * Returns { data: { min_choices, max_choices, current_departments,
   *                   available_departments, has_open_request } }
   */
  async getOptions(lang = 'am') {
    return apiService.request(`${BASE}/options${buildQuery({ lang })}`)
  }

  /**
   * GET /api/v1/class-change/requests
   * Returns { data: [ { id, status, from_department, choices, approved_department,
   *                     reason, review_note, requested_at, reviewed_at }, ... ] }
   */
  async getRequests(lang = 'am') {
    return apiService.request(`${BASE}/requests${buildQuery({ lang })}`)
  }

  /**
   * POST /api/v1/class-change/requests
   * payload: { choices: [id, ...], reason?: string, from_department_id?: number }
   * Returns { data: <the created request> }
   */
  async submitRequest(payload, lang = 'am') {
    return apiService.request(`${BASE}/requests${buildQuery({ lang })}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * DELETE /api/v1/class-change/requests/{id}
   * Cancels my own pending request. 404 for others', 422 if not pending.
   */
  async cancelRequest(id, lang = 'am') {
    return apiService.request(`${BASE}/requests/${id}${buildQuery({ lang })}`, {
      method: 'DELETE',
    })
  }
}

export const classChangeService = new ClassChangeService()