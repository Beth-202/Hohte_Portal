<template>
  <div class="question-text">
    <textarea
      :value="value"
      @input="$emit('update', $event.target.value)"
      class="text-input"
      :placeholder="placeholder"
      rows="3"
    ></textarea>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Type here...'
  }
})

defineEmits(['update'])
</script>

<style scoped>
.question-text {
  width: 100%;
}

.text-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: #FFC125;
}

.text-input::placeholder {
  color: #666;
}
</style>