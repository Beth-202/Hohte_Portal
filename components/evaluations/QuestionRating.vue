<template>
  <div class="question-rating">
    <div class="rating-stars">
      <button        v-for="i in maxRating"
        :key="i"
        type="button"
        class="star-btn"
        @click="$emit('update', i)"
      >
        <svg
          class="star-icon"
          :class="{ filled: value >= i }"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <span class="rating-label">{{ value || 0 }} / {{ maxRating }}</span>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: Number,
    default: null
  },
  maxRating: {
    type: Number,
    required: true
  }
})

defineEmits(['update'])
</script>

<style scoped>
.question-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-stars {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.15s ease;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star-icon {
  color: #555;
  transition: color 0.2s ease;
}

.star-icon.filled {
  color: #FFC125;
  fill: #FFC125;
}

.rating-label {
  color: #a0b3d9;
  font-size: 14px;
  min-width: 50px;
}
</style>