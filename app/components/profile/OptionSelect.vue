<template>
  <div class="option-select">
    <!-- Non-searchable: native select (fast, works great for short lists) -->
    <select
      v-if="!searchable"
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

    <!-- Searchable: filter-as-you-type list -->
    <div v-else class="searchable" :class="{ error: !!error }">
      <div class="selected-display" @click="toggleOpen">
        <span v-if="selectedLabel" class="selected-label">{{ selectedLabel }}</span>
        <span v-else class="placeholder-label">{{ placeholder }}</span>
        <svg class="chevron" :class="{ rotated: open }" viewBox="0 0 24 24" width="18" height="18">
          <path d="M7 10l5 5 5-5z" fill="currentColor" />
        </svg>
      </div>

      <div v-if="open" class="dropdown">
        <input
          ref="searchInput"
          v-model="searchTerm"
          type="text"
          class="search-input"
          :placeholder="searchPlaceholder"
          @keydown.esc="close"
          @keydown.enter.prevent="pickFirstMatch"
        />

        <ul class="list">
          <li
            v-for="opt in filtered"
            :key="opt.value"
            class="list-item"
            @click="pick(opt.value)"
          >
            {{ opt.label }}
          </li>
          <li v-if="!filtered.length" class="list-empty">
            {{ noResultsLabel }}
          </li>
          <li
            v-if="allowOther"
            class="list-item list-other"
            @click="pickOther"
          >
            ＋ {{ otherLabel }}
          </li>
        </ul>
      </div>

      <input
        v-if="showOtherInput"
        v-model="otherValue"
        type="text"
        class="text-input other-input"
        :placeholder="otherPlaceholder"
        @input="emitOther"
      />
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  otherModelValue: { type: [String, null], default: null },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Choose...' },
  searchPlaceholder: { type: String, default: 'Search...' },
  otherLabel: { type: String, default: 'Other' },
  otherPlaceholder: { type: String, default: 'Type your answer' },
  noResultsLabel: { type: String, default: 'No matches' },
  allowOther: { type: Boolean, default: true },
  searchable: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:otherModelValue'])

const searchTerm = ref('')
const open = ref(false)
const showOtherInput = ref(false)
const otherValue = ref(props.otherModelValue || '')
const searchInput = ref(null)

// Keep both label_en and label_am so search matches whichever language the
// user types in, regardless of which one is displayed.
const normalized = computed(() =>
  (props.options || []).map((o) => ({
    value: o.code !== undefined ? o.code : o.id,
    label: o.label,
    label_en: o.label_en || o.label,
    label_am: o.label_am || o.label,
    group: o.group || '',
  }))
)

// Cross-language, case-insensitive substring match against label, label_en
// and label_am. Lets a user in the Amharic UI find "Ethiopia" by typing
// either "eth" or "ኢት", and vice versa.
const filtered = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return normalized.value
  return normalized.value.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      (o.label_en || '').toLowerCase().includes(q) ||
      (o.label_am || '').toLowerCase().includes(q)
  )
})

// For the non-searchable native select path: keep groups
const groupedOptions = computed(() => {
  const map = new Map()
  normalized.value.forEach((o) => {
    if (!map.has(o.group)) map.set(o.group, [])
    map.get(o.group).push(o)
  })
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})

const selectedLabel = computed(() => {
  const match = normalized.value.find((o) => o.value === props.modelValue)
  return match ? match.label : ''
})

// Non-searchable: <select> change
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

// Searchable: open / close
const toggleOpen = async () => {
  open.value = !open.value
  if (open.value) {
    searchTerm.value = ''
    await nextTick()
    searchInput.value?.focus()
  }
}

const close = () => {
  open.value = false
  searchTerm.value = ''
}

const pick = (value) => {
  showOtherInput.value = false
  emit('update:otherModelValue', null)
  emit('update:modelValue', value)
  close()
}

const pickOther = () => {
  showOtherInput.value = true
  emit('update:modelValue', null)
  close()
}

const pickFirstMatch = () => {
  if (filtered.value.length === 1) pick(filtered.value[0].value)
}

const emitOther = () => {
  emit('update:otherModelValue', otherValue.value || null)
}

// Close on outside click
const onDocClick = (e) => {
  if (!e.target.closest('.searchable')) close()
}

watch(
  () => open.value,
  (v) => {
    if (typeof document === 'undefined') return
    if (v) document.addEventListener('click', onDocClick)
    else document.removeEventListener('click', onDocClick)
  }
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocClick)
  }
})

// If parent hydrates `otherModelValue` (e.g. loaded profile has city_other), show input
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

/* ---------- Non-searchable select ---------- */
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
.select-input:focus { border-color: #ffc125; background: rgba(255, 255, 255, 0.1); }
.select-input.error { border-color: #ff8a80; }

/* ---------- Searchable dropdown ---------- */
.searchable { position: relative; }

.selected-display {
  width: 100%;
  padding: 12px 34px 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.selected-display:hover { background: rgba(255, 255, 255, 0.1); }
.searchable.error .selected-display { border-color: #ff8a80; }

.selected-label { color: #fff; }
.placeholder-label { color: #a0b3d9; }

.chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0b3d9;
  transition: transform 0.2s ease;
}
.chevron.rotated { transform: translateY(-50%) rotate(180deg); }

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: #1e3971;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-height: 280px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
}
.search-input::placeholder { color: #a0b3d9; }

.list {
  list-style: none;
  padding: 4px 0;
  margin: 0;
  overflow-y: auto;
  max-height: 220px;
}
.list-item {
  padding: 10px 14px;
  color: #e6ecf7;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.list-item:hover { background: rgba(255, 255, 255, 0.08); }
.list-other { color: #ffc125; font-weight: 600; }
.list-empty {
  padding: 14px;
  color: #a0b3d9;
  font-size: 14px;
  text-align: center;
}

.other-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  margin-top: 6px;
}
.other-input:focus { border-color: #ffc125; background: rgba(255, 255, 255, 0.1); }
.other-input::placeholder { color: #a0b3d9; }

.error-message {
  color: #ff8a80;
  font-size: 13px;
  margin: 0;
}
</style>