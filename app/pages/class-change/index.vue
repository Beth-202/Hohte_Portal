<template>
  <div class="cc-page">
    <!-- Toasts -->
    <div class="toast-container">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>

    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="t('common.back')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="header-text">
        <h1 class="page-title">{{ t('classChange.title') }}</h1>
        <p class="page-subtitle">{{ t('classChange.subtitle') }}</p>
      </div>
    </header>

    <!-- Loading / Error -->
    <div v-if="initialLoading" class="state-block">
      <div class="spinner"></div>
      <p>{{ t('classChange.loading') }}</p>
    </div>

    <div v-else-if="loadError" class="state-block">
      <p class="error-text">{{ loadError }}</p>
      <button class="btn-primary" @click="bootstrap">{{ t('classChange.retry') }}</button>
    </div>

    <template v-else>
      <!-- Current departments -->
      <div class="card">
        <h3 class="card-title">{{ t('classChange.currentDepartments') }}</h3>
        <div v-if="currentDepartments.length" class="chips">
          <span v-for="d in currentDepartments" :key="d.id" class="chip">{{ d.label }}</span>
        </div>
        <p v-else class="muted">{{ t('profile.notSet') }}</p>
      </div>

      <!-- Open request notice -->
      <div v-if="hasOpenRequest" class="notice notice-warn">
        {{ t('classChange.openRequestNotice') }}
      </div>

      <!-- Insufficient options -->
      <div v-else-if="!canSubmitAtAll" class="notice notice-warn">
        {{ t('classChange.insufficientOptions') }}
      </div>

      <!-- Request form -->
      <div v-else class="card">
        <!-- From department (only if >1 current) -->
        <div v-if="needsFromDepartment" class="field">
          <label class="field-label">
            {{ t('classChange.leaveWhich') }}
            <span class="required">*</span>
          </label>
          <p class="field-hint">{{ t('classChange.leaveWhichHint') }}</p>
          <select v-model="fromDepartmentId" class="select-input" :class="{ error: fromDeptError }">
            <option value="">{{ t('classChange.chooseDepartment') }}</option>
            <option v-for="d in currentDepartments" :key="d.id" :value="d.id">
              {{ d.label }}
            </option>
          </select>
          <p v-if="fromDeptError" class="field-error">{{ fromDeptError }}</p>
        </div>

        <!-- Choices -->
        <h4 class="section-subtitle">{{ t('classChange.yourChoices') }}</h4>

        <div
          v-for="(choice, idx) in choices"
          :key="idx"
          class="field"
        >
          <label class="field-label">
            {{ rankLabel(idx + 1) }}
            <span v-if="idx < minChoices" class="required">*</span>
          </label>
          <select
            :value="choice"
            class="select-input"
            :class="{ error: choiceError(idx) }"
            @change="onChoiceChange(idx, $event)"
          >
            <option value="">{{ t('classChange.chooseDepartment') }}</option>
            <option
              v-for="d in optionsForDropdown(idx)"
              :key="d.id"
              :value="d.id"
            >
              {{ d.label }}
            </option>
          </select>
          <p v-if="choiceError(idx)" class="field-error">{{ choiceError(idx) }}</p>
        </div>

        <!-- Reason -->
        <div class="field">
          <label class="field-label">{{ t('classChange.reasonLabel') }}</label>
          <textarea
            v-model="reason"
            class="text-area"
            rows="3"
            :placeholder="t('classChange.reasonPlaceholder')"
          ></textarea>
        </div>

        <!-- Submit -->
        <div class="form-footer">
          <button
            type="button"
            class="btn-save"
            :disabled="!canSubmit || isSubmitting"
            @click="submit"
          >
            {{ isSubmitting ? t('classChange.submitting') : t('classChange.submit') }}
          </button>
        </div>
      </div>

      <!-- My requests -->
      <div class="card">
        <h3 class="card-title">{{ t('classChange.myRequests') }}</h3>
        <p v-if="!requests.length" class="muted">{{ t('classChange.noRequests') }}</p>

        <ul v-else class="req-list">
          <li v-for="r in requests" :key="r.id" class="req-item">
            <div class="req-row">
              <span class="req-id">#{{ r.id }}</span>
              <span class="req-status" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
            </div>

            <div v-if="r.from_department" class="req-line">
              <span class="req-label">{{ t('classChange.from') }}:</span>
              <span>{{ r.from_department.label }}</span>
            </div>

            <div v-if="r.choices?.length" class="req-line">
              <span class="req-label">{{ t('classChange.choices') }}:</span>
              <ol class="req-choices">
                <li v-for="c in r.choices" :key="c.rank">
                  {{ c.department?.label }}
                </li>
              </ol>
            </div>

            <div v-if="r.approved_department" class="req-line">
              <span class="req-label">{{ t('classChange.approvedDept') }}:</span>
              <span class="approved">{{ r.approved_department.label }}</span>
            </div>

            <div v-if="r.reason" class="req-line">
              <span class="req-label">{{ t('classChange.reason') }}:</span>
              <span>{{ r.reason }}</span>
            </div>

            <p v-if="r.status === 'rejected' && r.review_note" class="req-note">
              {{ r.review_note }}
            </p>

            <div class="req-footer">
              <span class="req-date">{{ dateLabel(r) }}</span>
              <button
                v-if="r.status === 'pending'"
                type="button"
                class="btn-cancel"
                :disabled="isCancelling"
                @click="confirmCancel(r)"
              >
                {{ isCancelling ? t('classChange.cancelling') : t('classChange.cancel') }}
              </button>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLanguage } from '~/composables/useLanguage'
import { useNavigation } from '~/composables/useNavigation'
import { useToast } from '~/composables/useToast'
import { useTelegram } from '~/composables/useTelegram'
import { useClassChange } from '~/composables/useClassChange'
import ToastNotification from '~/components/ToastNotification.vue'

const { t } = useLanguage()
const { goBack } = useNavigation()
const { toasts, success, error: toastError, removeToast } = useToast()
const { showConfirm } = useTelegram()

const {
  isLoading,
  isSubmitting,
  isCancelling,
  error: apiError,
  lastValidationErrors,
  minChoices,
  maxChoices,
  currentDepartments,
  availableDepartments,
  hasOpenRequest,
  needsFromDepartment,
  requests,
  loadAll,
  submitRequest,
  cancelRequest,
  fieldError,
} = useClassChange()

const initialLoading = ref(true)
const loadError = ref('')
const fromDepartmentId = ref('')
const choices = ref([])
const reason = ref('')
const localErrors = ref({}) // { noChoices, duplicate, noFromDept }

// ------------------------------------------------------------------
// Initialize choices array based on min/max and available count
// ------------------------------------------------------------------
const initializeChoices = () => {
  const min = Math.min(minChoices.value, availableDepartments.value.length)
  const n = Math.max(min, 1)
  choices.value = new Array(n).fill('')
}

// ------------------------------------------------------------------
// Dropdown filtering: exclude ids picked elsewhere
// ------------------------------------------------------------------
const optionsForDropdown = (idx) => {
  const picked = choices.value.filter((c, i) => i !== idx && c)
  return availableDepartments.value.filter((d) => !picked.includes(d.id))
}

// ------------------------------------------------------------------
// Choice change handler
// ------------------------------------------------------------------
const onChoiceChange = (idx, event) => {
  const val = event.target.value ? Number(event.target.value) : ''
  choices.value[idx] = val

  // Auto-add a new empty dropdown when the last one is filled and we're
  // still under maxChoices.
  const filled = choices.value.filter(Boolean).length
  const max = Math.min(maxChoices.value, availableDepartments.value.length)
  if (filled === choices.value.length && choices.value.length < max) {
    choices.value.push('')
  }

  // Clear local error
  localErrors.value.duplicate = false
}

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------
const pickedChoices = computed(() => choices.value.filter(Boolean))

const hasDuplicates = computed(() => {
  const s = new Set()
  for (const c of pickedChoices.value) {
    if (s.has(c)) return true
    s.add(c)
  }
  return false
})

const canSubmitAtAll = computed(() => {
  const max = Math.min(maxChoices.value, availableDepartments.value.length)
  return max >= Math.min(minChoices.value, availableDepartments.value.length) && max > 0
})

const canSubmit = computed(() => {
  if (hasOpenRequest.value) return false
  const min = Math.min(minChoices.value, availableDepartments.value.length)
  if (pickedChoices.value.length < min) return false
  if (hasDuplicates.value) return false
  if (needsFromDepartment.value && !fromDepartmentId.value) return false
  return true
})

// ------------------------------------------------------------------
// Field error display
// ------------------------------------------------------------------
const fromDeptError = computed(() => {
  if (localErrors.value.noFromDept) return t('classChange.errorNoFromDept')
  return ''
})

const choiceError = (idx) => {
  // 422 from server uses keys like "choices.0", "choices.1"
  const serverErr = fieldError(`choices.${idx}`)
  if (serverErr) return serverErr
  if (idx === 0 && localErrors.value.noChoices) return t('classChange.errorNoChoices')
  return ''
}

// ------------------------------------------------------------------
// Submit
// ------------------------------------------------------------------
const submit = async () => {
  localErrors.value = {}

  const min = Math.min(minChoices.value, availableDepartments.value.length)
  if (pickedChoices.value.length < min) {
    localErrors.value.noChoices = true
    toastError(t('classChange.errorNoChoices'))
    return
  }
  if (hasDuplicates.value) {
    localErrors.value.duplicate = true
    toastError(t('classChange.errorDuplicate'))
    return
  }
  if (needsFromDepartment.value && !fromDepartmentId.value) {
    localErrors.value.noFromDept = true
    toastError(t('classChange.errorNoFromDept'))
    return
  }

  const payload = {
    choices: pickedChoices.value,
  }
  if (reason.value.trim()) payload.reason = reason.value.trim()
  if (needsFromDepartment.value) payload.from_department_id = Number(fromDepartmentId.value)

  try {
    await submitRequest(payload)
    success(t('classChange.submitSuccess'))
    // Reset local form
    fromDepartmentId.value = ''
    reason.value = ''
    initializeChoices()
  } catch (err) {
    if (err.status === 422 && err.errors) {
      toastError(t('classChange.submitFailed'))
    } else if (err.status === 401) {
      toastError(t('classChange.sessionExpired'))
    } else {
      toastError(t('classChange.networkError'))
    }
  }
}

// ------------------------------------------------------------------
// Cancel
// ------------------------------------------------------------------
const confirmCancel = async (r) => {
  const ok = await showConfirm(t('classChange.cancelConfirm'))
  if (!ok) return
  try {
    await cancelRequest(r.id)
    success(t('classChange.cancelSuccess'))
  } catch (err) {
    if (err.status === 422) {
      toastError(t('classChange.alreadyHasPending'))
    } else {
      toastError(t('classChange.cancelFailed'))
    }
  }
}

// ------------------------------------------------------------------
// Display helpers
// ------------------------------------------------------------------
const rankLabel = (n) => {
  if (n === 1) return t('classChange.choice1')
  if (n === 2) return t('classChange.choice2')
  if (n === 3) return t('classChange.choice3')
  return t('classChange.choiceN', { n })
}

const statusLabel = (s) => {
  const key = `classChange.status${String(s || '').charAt(0).toUpperCase()}${String(s || '').slice(1)}`
  const val = t(key)
  return val === key ? s : val
}

const statusClass = (s) => `status-${s}`

const dateLabel = (r) => {
  const d = r.reviewed_at || r.requested_at
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}

// ------------------------------------------------------------------
// Bootstrap
// ------------------------------------------------------------------
const bootstrap = async () => {
  initialLoading.value = true
  loadError.value = ''
  try {
    await loadAll()
    initializeChoices()
  } catch (err) {
    if (err.status === 401) {
      loadError.value = t('classChange.sessionExpired')
    } else {
      loadError.value = t('classChange.loadError')
    }
  } finally {
    initialLoading.value = false
  }
}

onMounted(bootstrap)
</script>

<style scoped>
.cc-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3971 0%, #0d1f40 100%);
  color: #fff;
  padding: 20px 16px 110px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toast-container {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9999;
  pointer-events: none;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}
.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.back-btn:hover { background: rgba(255, 255, 255, 0.18); }
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 22px; font-weight: 800; color: #ffc125; margin: 0; }
.page-subtitle { margin: 2px 0 0; font-size: 13px; color: #a0b3d9; }

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 60px 20px;
  color: #a0b3d9;
  text-align: center;
}
.error-text { color: #ff8a80; }

.btn-primary {
  background: #ffc125;
  color: #1e3971;
  border: none;
  border-radius: 10px;
  padding: 12px 22px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
}

.card {
  background: #2b4b8f;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-title { font-size: 17px; font-weight: 700; margin: 0; color: #fff; }
.section-subtitle {
  font-size: 15px;
  font-weight: 600;
  color: #ffc125;
  margin: 6px 0 0;
}

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  background: rgba(255, 193, 37, 0.15);
  color: #ffc125;
  border: 1px solid rgba(255, 193, 37, 0.4);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
}

.muted { color: #a0b3d9; font-size: 14px; margin: 0; }

.notice {
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
}
.notice-warn {
  background: rgba(255, 193, 37, 0.12);
  border: 1px solid rgba(255, 193, 37, 0.4);
  color: #ffc125;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #e6ecf7;
  display: flex;
  align-items: center;
  gap: 6px;
}
.field-hint { font-size: 12px; color: #a0b3d9; margin: 0; }
.required { color: #ff8a80; font-weight: 800; }

.select-input,
.text-area {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
}
.select-input option { color: #000; background: #fff; }
.select-input:focus,
.text-area:focus { border-color: #ffc125; background: rgba(255, 255, 255, 0.1); }
.select-input.error { border-color: #ff8a80; }
.text-area { resize: vertical; min-height: 80px; }
.text-area::placeholder { color: #a0b3d9; }

.field-error { color: #ff8a80; font-size: 12px; margin: 0; }

.form-footer { display: flex; justify-content: flex-end; margin-top: 4px; }

.btn-save {
  background: #ffc125;
  color: #1e3971;
  border: none;
  border-radius: 10px;
  padding: 12px 26px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.btn-save:hover:not(:disabled) { transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

.req-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.req-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.req-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.req-id { color: #a0b3d9; font-size: 13px; font-weight: 600; }
.req-status {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.status-pending { background: rgba(255, 193, 37, 0.15); color: #ffc125; }
.status-approved { background: rgba(76, 175, 80, 0.15); color: #8be08f; }
.status-rejected { background: rgba(255, 138, 128, 0.15); color: #ff8a80; }
.status-cancelled { background: rgba(160, 179, 217, 0.15); color: #a0b3d9; }

.req-line { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; color: #e6ecf7; }
.req-label { color: #a0b3d9; font-weight: 600; flex-shrink: 0; }
.req-choices { list-style: decimal; padding-left: 20px; margin: 0; }
.approved { color: #8be08f; font-weight: 600; }
.req-note {
  margin: 0;
  font-size: 13px;
  color: #ff8a80;
  background: rgba(255, 138, 128, 0.08);
  padding: 8px 10px;
  border-radius: 8px;
}
.req-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.req-date { color: #a0b3d9; font-size: 12px; }
.btn-cancel {
  background: transparent;
  color: #ff8a80;
  border: 1px solid rgba(255, 138, 128, 0.4);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffc125;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>