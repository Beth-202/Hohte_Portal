<template>
  <div class="option-select">
    <div v-if="searchable" class="search-row">
      <input
        v-model="searchTerm"
        type="text"
        class="text-input search-input"
        :placeholder="searchPlaceholder"
        @focus="open = true"
      />
    </div>

    <select
      :value="modelValue || ''"
      class="select-input"
      :class="{ error: !!error }"
      @change="onSelect"
    >
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
        >
          {{ opt.label }}
        </option>
      </optgroup>
      <option v-if="allowOther" value="__other__">＋ {{ otherLabel }}</option>
    </select>

    <input
      v-if="showOtherInput"
      v-model="otherValue"
      type="text"
      class="text-input other-input"
      :placeholder="otherPlaceholder"
      @input="emitOther"
    />

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  otherModelValue: { type: [String, null], default: null },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Choose...' },
  searchPlaceholder: { type: String, default: 'Search...' },
  otherLabel: { type: String, default: 'Other' },
  otherPlaceholder: { type: String, default: 'Type your answer' },
  allowOther: { type: Boolean, default: true },
  searchable: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:otherModelValue'])

const searchTerm = ref('')
const open = ref(false)
const showOtherInput = ref(false)
const otherValue = ref(props.otherModelValue || '')

const normalized = computed(() =>
  (props.options || []).map((o) => ({
    value: o.code !== undefined ? o.code : o.id,
    label: o.label,
    group: o.group || '',
  }))
)

const filtered = computed(() => {
  if (!props.searchable || !searchTerm.value.trim()) return normalized.value
  const q = searchTerm.value.trim().toLowerCase()
  return normalized.value.filter((o) => o.label.toLowerCase().includes(q))
})

const groupedOptions = computed(() => {
  const map = new Map()
  filtered.value.forEach((o) => {
    if (!map.has(o.group)) map.set(o.group, [])
    map.get(o.group).push(o)
  })
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})

const onSelect = (e) => {
  const v = e.target.value
  if (v === '__other__') {
    showOtherInput.value = true
    emit('update:modelValue', null)
    return
  }
  showOtherInput.value = false
  emit('update:otherModelValue', null)
  emit('update:modelValue', v || null)
}

const emitOther = () => {
  emit('update:otherModelValue', otherValue.value || null)
}

watch(
  () => props.otherModelValue,
  (nv) => {
    if (nv) {
      showOtherInput.value = true
      otherValue.value = nv
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.option-select { display: flex; flex-direction: column; gap: 8px; }

.search-row { margin-bottom: 2px; }

.text-input,
.select-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.text-input::placeholder { color: #a0b3d9; }

.select-input {
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, #a0b3d9 50%),
    linear-gradient(135deg, #a0b3d9 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(1em + 2px),
    calc(100% - 13px) calc(1em + 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 34px;
}
.select-input option,
.select-input optgroup { color: #000; background: #fff; }

.text-input:focus,
.select-input:focus {
  border-color: #ffc125;
  background: rgba(255, 255, 255, 0.1);
}

.select-input.error,
.other-input.error {
  border-color: #ff8a80;
}

.other-input { margin-top: 4px; }

.error-message {
  color: #ff8a80;
  font-size: 13px;
  margin: 0;
}
</style>