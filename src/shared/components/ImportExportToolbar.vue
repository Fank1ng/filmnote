<script setup lang="ts">
import { ref } from 'vue';

defineOptions({ name: 'ImportExportToolbar' });

const emit = defineEmits<{
  exportJson: [];
  importJson: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

function chooseFile(): void {
  fileInput.value?.click();
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit('importJson', file);
  input.value = '';
}
</script>

<template>
  <section class="settings-section">
    <h3>数据管理</h3>
    <div class="btn-group">
      <button type="button" class="btn btn-secondary" @click="emit('exportJson')">导出 JSON</button>
      <button type="button" class="btn btn-secondary" @click="chooseFile">导入 JSON</button>
      <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onFileChange">
    </div>
  </section>
</template>
