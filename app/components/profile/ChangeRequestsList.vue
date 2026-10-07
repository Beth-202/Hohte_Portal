<template>
  <div class="change-requests">
    <h3 class="cr-title">{{ title }}</h3>
    <p v-if="!items.length" class="cr-empty">{{ emptyLabel }}</p>

    <ul v-else class="cr-list">
      <li v-for="cr in items" :key="cr.id" class="cr-item">
        <div class="cr-row">
          <span class="cr-field">{{ cr.field_label || cr.field }}</span>
          <span class="cr-status" :class="statusClass(cr.status)">{{ statusLabel(cr.status) }}</span>
        </div>
        <div class="cr-values">
          <span class="cr-old">{{ cr.old_value || '—' }}</span>
          <span class="cr-arrow">→</span>
          <span class="cr-new">{{ cr.new_value || '—' }}</span>
        </div>
        <p v-if="cr.status === 'rejected' && cr.review_note" class="cr-note">
          {{ rejectPrefix }}{{ cr.review_note }}
        </p>
        <p class="cr-date">{{ dateLabel(cr) }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '~/composables/useLanguage'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const { t } = useLanguage()

const title = computed(() => t('profile.changeRequestsTitle'))
const emptyLabel = computed(() => t('profile.changeRequestsEmpty'))
const rejectPrefix = computed(() => t('profile.rejectedReason', { note: '' }).replace(/:\s*$/, ': '))

const statusLabel = (s) => {
  const key = `profile.status${String(s || '').charAt(0).toUpperCase()}${String(s || '').slice(1)}`
  const val = t(key)
  return val === key ? s : val
}

const statusClass = (s) => `status-${s}`

const dateLabel = (cr) => {
  const d = cr.reviewed_at || cr.requested_at
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}
</script>

<style scoped>
.change-requests {
  background: #2b4b8f;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.cr-title { margin: 0 0 12px; font-size: 17px; color: #fff; font-weight: 700; }
.cr-empty { color: #a0b3d9; font-size: 14px; margin: 0; }

.cr-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }

.cr-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
}
.cr-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.cr-field { color: #fff; font-weight: 600; font-size: 14px; }
.cr-status {
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

.cr-values {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #e6ecf7;
  font-size: 14px;
}
.cr-old { color: #a0b3d9; text-decoration: line-through; }
.cr-arrow { color: #a0b3d9; }
.cr-new { font-weight: 600; }

.cr-note {
  margin: 8px 0 0;
  font-size: 13px;
  color: #ff8a80;
}
.cr-date { margin: 6px 0 0; font-size: 12px; color: #a0b3d9; }
</style>