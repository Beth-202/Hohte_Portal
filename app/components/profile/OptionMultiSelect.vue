<template>
  <div class="option-multi">
    <!-- Selected chips -->
    <div v-if="selectedChips.length" class="chips">
      <span
        v-for="chip in selectedChips"
        :key="chip.value"
        class="chip"
      >
        {{ chip.label }}
        <button
          type="button"
          class="chip-remove"
          @click="remove(chip.value)"
          :aria-label="removeLabel"
        >×</button>
      </span>
    </div>

    <!-- Add picker -->
    <div class="picker-row">
      <select class="select-input" @change="onPick">
        <option value="">{{ placeholder }}</option>
        <optgroup
          v-for="group in groupedOptions"
          :key="group.name || '_'"
          :label="group.name || undefined"
        >
          <option
            v-for="opt in group.items"
            :key="opt.value"
            :value="opt.value"
            :disabled="isPicked(opt.value)"
          >
            {{ opt.label }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Other free-text list -->
    <div class="other-block">
      <div v-if="otherList.length" class="chips">
        <span
          v-for="(val, idx) in otherList"
          :key="'other-' + idx"
          class="chip chip-other"
        >
          {{ val }}
          <button
            type="button"
            class="chip-remove"
            @click="removeOther(idx)"
          >×</button>
        </span>
      </div>

      <div class="other-input-row">
        <input
          v-model="otherDraft"
          type="text"
          class="text-input"
          :placeholder="otherPlaceholder"
          :disabled="otherList.length >= maxOthers"
          @keydown.enter.prevent="addOther"
        />
        <button
          type="button"
          class="add-btn"
          :disabled="!otherDraft.trim() || otherList.length >= maxOthers"
          @click="addOther"
        >{{ addLabel }}</button>
      </div>

      <p v-if="otherList.length >= maxOthers" class="hint">
        {{ maxOthersLabel.replace('{max}', String(maxOthers)) }}
      </p>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // array of codes/ids (strings/numbers)
  modelValue: { type: Array, default: () => [] },
  // array of free-text strings
  otherModelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Choose...' },
  otherPlaceholder: { type: String, default: 'Type your answer' },
  addLabel: { type: String, default: 'Add' },
  removeLabel: { type: String, default: 'Remove' },
  maxOthers: { type: Number, default: 10 },
  maxOthersLabel: { type: String, default: 'You can add up to {max} entries.' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:otherModelValue'])

const otherDraft = ref('')

const normalized = computed(() =>
  (props.options || []).map((o) => ({
    value: o.code !== undefined ? o.code : o.id,
    label: o.label,
    group: o.group || '',
  }))
)

const groupedOptions = computed(() => {
  const map = new Map()
  normalized.value.forEach((o) => {
    if (!map.has(o.group)) map.set(o.group, [])
    map.get(o.group).push(o)
  })
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})

const selectedChips = computed(() =>
  (props.modelValue || []).map((v) => {
    const match = normalized.value.find((o) => o.value === v)
    return { value: v, label: match ? match.label : String(v) }
  })
)

const otherList = computed(() => props.otherModelValue || [])

const isPicked = (v) => (props.modelValue || []).includes(v)

const onPick = (e) => {
  const v = e.target.value
  e.target.value = ''
  if (!v || isPicked(v)) return
  emit('update:modelValue', [...(props.modelValue || []), v])
}

const remove = (v) => {
  emit('update:modelValue', (props.modelValue || []).filter((x) => x !== v))
}

const addOther = () => {
  const v = otherDraft.value.trim()
  if (!v) return
  if (otherList.value.length >= props.maxOthers) return
  emit('update:otherModelValue', [...otherList.value, v])
  otherDraft.value = ''
}

const removeOther = (idx) => {
  const next = [...otherList.value]
  next.splice(idx, 1)
  emit('update:otherModelValue', next)
}
</script>

<style scoped>
.option-multi { display: flex; flex-direction: column; gap: 10px; }

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 193, 37, 0.15);
  color: #ffc125;
  border: 1px solid rgba(255, 193, 37, 0.4);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
}
.chip-other {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.chip-remove {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  opacity: 0.75;
}
.chip-remove:hover { opacity: 1; }

.select-input,
.text-input {
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
.select-input option,
.select-input optgroup { color: #000; background: #fff; }
.select-input:focus,
.text-input:focus { border-color: #ffc125; background: rgba(255, 255, 255, 0.1); }
.text-input::placeholder { color: #a0b3d9; }

.other-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.other-input-row {
  display: flex;
  gap: 8px;
}

.add-btn {
  background: #ffc125;
  color: #1e3971;
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  white-space: nowrap;
}
.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.hint {
  font-size: 12px;
  color: #a0b3d9;
  margin: 0;
}

.error-message {
  color: #ff8a80;
  font-size: 13px;
  margin: 0;
}
</style>