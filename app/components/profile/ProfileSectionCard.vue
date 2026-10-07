<template>
  <div class="section-card" :class="{ expanded, dirty, saving }">
    <button
      type="button"
      class="section-header"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <div class="section-header-left">
        <h3 class="section-title">{{ title }}</h3>
        <p v-if="summary && !expanded" class="section-summary">{{ summary }}</p>
      </div>
      <div class="section-header-right">
        <span v-if="dirty && !expanded" class="dirty-dot" aria-hidden="true"></span>
        <svg class="chevron" :class="{ rotated: expanded }" viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 10l5 5 5-5z" fill="currentColor" />
        </svg>
      </div>
    </button>

    <transition name="section-body">
      <div v-if="expanded" class="section-body">
        <slot />

        <div class="section-footer">
          <p v-if="footerError" class="footer-error">{{ footerError }}</p>
          <div class="footer-actions">
            <button
              type="button"
              class="btn-save"
              :disabled="!dirty || saving"
              @click="$emit('save')"
            >
              {{ saving ? savingLabel : saveLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  dirty: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saveLabel: { type: String, default: 'Save' },
  savingLabel: { type: String, default: 'Saving...' },
  footerError: { type: String, default: '' },
  startExpanded: { type: Boolean, default: false },
})

defineEmits(['save'])

const expanded = ref(props.startExpanded)

const toggle = () => {
  expanded.value = !expanded.value
}

watch(
  () => props.dirty,
  (isDirty, wasDirty) => {
    if (wasDirty && !isDirty && !props.saving) {
      expanded.value = false
    }
  }
)

defineExpose({
  expand: () => { expanded.value = true },
  collapse: () => { expanded.value = false },
  isExpanded: () => expanded.value,
})
</script>

<style scoped>
.section-card {
  background: #2b4b8f;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: border-color 0.2s ease;
}
.section-card.dirty {
  border-color: rgba(255, 193, 37, 0.5);
}

.section-header {
  width: 100%;
  background: transparent;
  border: none;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  color: #fff;
  text-align: left;
  font-family: inherit;
}

.section-header-left {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.section-summary {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #a0b3d9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffc125;
  box-shadow: 0 0 0 4px rgba(255, 193, 37, 0.2);
}

.chevron {
  color: #a0b3d9;
  transition: transform 0.25s ease;
}
.chevron.rotated {
  transform: rotate(180deg);
}

.section-body {
  padding: 0 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 18px;
}

.section-footer {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-error {
  color: #ff8a80;
  font-size: 13px;
  margin: 0;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background: #ffc125;
  color: #1e3971;
  border: none;
  border-radius: 10px;
  padding: 12px 26px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
  font-family: inherit;
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
}
.btn-save:active:not(:disabled) {
  transform: translateY(0);
}
.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.section-body-enter-active,
.section-body-leave-active {
  transition: opacity 0.2s ease;
}
.section-body-enter-from,
.section-body-leave-to {
  opacity: 0;
}
</style>