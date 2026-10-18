<script setup>
// Lets a member pick when to come to the office to explain a long-term
// permission request: the open days first, then that day's sessions.
import { ref, computed, watch, onMounted } from 'vue'
import { useLanguage } from '~/composables/useLanguage'
import { apiService } from '~/services/api.service'

const props = defineProps({
  classId: { type: [Number, String], default: null },
  modelValue: { type: Object, default: null }, // { date, session_id }
})
const emit = defineEmits(['update:modelValue'])

const { t } = useLanguage()

const slots = ref([])
const isLoading = ref(false)
const loadFailed = ref(false)
const chosenDate = ref(props.modelValue?.date || null)

const days = computed(() => {
  const byDate = new Map()
  for (const slot of slots.value) {
    if (!byDate.has(slot.date)) {
      byDate.set(slot.date, { date: slot.date, dateEc: slot.date_ec, weekday: slot.weekday, seatsLeft: 0 })
    }
    byDate.get(slot.date).seatsLeft += slot.seats_left
  }
  return [...byDate.values()]
})

const sessionsOnChosenDate = computed(() => slots.value.filter(slot => slot.date === chosenDate.value))

const isChosen = (slot) => props.modelValue?.date === slot.date && props.modelValue?.session_id === slot.session_id

const chooseDate = (day) => {
  if (day.seatsLeft === 0) return
  chosenDate.value = day.date
}

const chooseSession = (slot) => {
  if (slot.seats_left === 0) return
  emit('update:modelValue', { date: slot.date, session_id: slot.session_id })
}

const reload = async () => {
  isLoading.value = true
  loadFailed.value = false
  try {
    const response = await apiService.getBookingSlots(props.classId)
    slots.value = Array.isArray(response) ? response : []
    if (props.modelValue && !slots.value.some(isChosen)) {
      emit('update:modelValue', null)
    }
  } catch (err) {
    console.error('Could not load office slots:', err)
    loadFailed.value = true
    slots.value = []
  } finally {
    isLoading.value = false
  }
}

watch(() => props.classId, reload)
onMounted(reload)

defineExpose({ reload })
</script>

<template>
  <div class="slot-picker">
    <p v-if="isLoading" class="slot-hint">{{ t('booking.loading') }}</p>
    <p v-else-if="loadFailed" class="slot-hint">{{ t('booking.loadFailed') }}</p>
    <p v-else-if="days.length === 0" class="slot-hint">{{ t('booking.noSlots') }}</p>

    <template v-else>
      <div class="slot-label">{{ t('booking.chooseDay') }}</div>
      <div class="slot-days">
        <button
          v-for="day in days"
          :key="day.date"
          type="button"
          class="slot-day"
          :class="{ active: chosenDate === day.date, full: day.seatsLeft === 0 }"
          :disabled="day.seatsLeft === 0"
          @click="chooseDate(day)"
        >
          <span class="slot-day-name">{{ t(`requestStatus.weekdays.${day.weekday}`) }}</span>
          <span class="slot-day-date">{{ day.dateEc }}</span>
          <span v-if="day.seatsLeft === 0" class="slot-day-full">{{ t('booking.full') }}</span>
        </button>
      </div>

      <template v-if="chosenDate">
        <div class="slot-label">{{ t('booking.chooseTime') }}</div>
        <div class="slot-sessions">
          <button
            v-for="slot in sessionsOnChosenDate"
            :key="slot.session_id"
            type="button"
            class="slot-session"
            :class="{ active: isChosen(slot) }"
            :disabled="slot.seats_left === 0"
            @click="chooseSession(slot)"
          >
            {{ slot.start_time }} - {{ slot.end_time }}
            <small>{{ slot.seats_left === 0 ? t('booking.full') : t('booking.seatsLeft', { count: slot.seats_left }) }}</small>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.slot-picker { display: flex; flex-direction: column; gap: 8px; }
.slot-hint { color: #b1afaf; font-size: 13px; margin: 0; }
.slot-label { color: #b1afaf; font-size: 13px; margin-top: 4px; }
.slot-days { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.slot-day {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 84px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}
.slot-day.active { background: #FFC125; border-color: #FFC125; color: #1e3971; }
.slot-day.full, .slot-session:disabled { opacity: 0.45; cursor: not-allowed; }
.slot-day-name { font-size: 13px; font-weight: 600; white-space: nowrap; }
.slot-day-date { font-size: 12px; white-space: nowrap; }
.slot-day-full { font-size: 11px; }
.slot-sessions { display: flex; flex-wrap: wrap; gap: 8px; }
.slot-session {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}
.slot-session small { font-size: 11px; opacity: 0.85; }
.slot-session.active { background: #FFC125; border-color: #FFC125; color: #1e3971; font-weight: 600; }
</style>
