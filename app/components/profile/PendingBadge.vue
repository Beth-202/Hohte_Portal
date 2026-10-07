<template>
  <span class="pending-badge" :title="title">
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" fill="currentColor"/>
    </svg>
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'Waiting for approval' },
  title: { type: String, default: '' },
})
</script>

<style scoped>
.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 193, 37, 0.15);
  color: #ffc125;
  border: 1px solid rgba(255, 193, 37, 0.4);
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
</style>