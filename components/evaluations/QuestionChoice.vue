<template>
  <div class="question-choice">
    <div
      v-for="option in options"
      :key="option.id"
      class="choice-option"
      @click="$emit('update', option.id)"
    >
      <div class="radio-circle" :class="{ selected: value === option.id }">
        <div v-if="value === option.id" class="radio-dot"></div>
      </div>
      <span class="choice-label">{{ option.label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: Number,
    default: null
  },
  options: {
    type: Array,
    required: true
  }
})

defineEmits(['update'])
</script>

<style scoped>
.question-choice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.choice-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.radio-circle.selected {
  border-color: #FFC125;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #FFC125;
}

.choice-label {
  color: white;
  font-size: 14px;
}
</style>