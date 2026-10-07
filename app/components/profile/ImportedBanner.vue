<template>
  <div class="imported-banner">
    <div class="banner-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 2 1 21h22L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V9h2v4Z" fill="currentColor"/>
      </svg>
    </div>
    <div class="banner-text">
      <p class="banner-title">{{ title }}</p>
      <p class="banner-body">{{ text }}</p>
    </div>
    <div class="banner-actions">
      <button
        type="button"
        class="btn-secondary"
        :disabled="confirming"
        @click="$emit('edit')"
      >{{ editLabel }}</button>
      <button
        type="button"
        class="btn-primary"
        :disabled="confirming"
        @click="$emit('confirm')"
      >{{ confirming ? '...' : confirmLabel }}</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Looks right' },
  editLabel: { type: String, default: 'Edit' },
  confirming: { type: Boolean, default: false },
})
defineEmits(['confirm', 'edit'])
</script>

<style scoped>
.imported-banner {
  background: linear-gradient(135deg, rgba(255, 193, 37, 0.15), rgba(255, 193, 37, 0.05));
  border: 1px solid rgba(255, 193, 37, 0.4);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  color: #fff;
}
.banner-icon { color: #ffc125; display: flex; align-items: flex-start; padding-top: 2px; }
.banner-title { font-weight: 700; margin: 0 0 4px; font-size: 15px; color: #ffc125; }
.banner-body { margin: 0; font-size: 13px; color: #e6ecf7; line-height: 1.5; }
.banner-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 6px;
}
.btn-primary,
.btn-secondary {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  border: none;
}
.btn-primary { background: #ffc125; color: #1e3971; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>