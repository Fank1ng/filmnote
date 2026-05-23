<script setup lang="ts">
defineOptions({ name: 'ImportExportToolbar' });

const emit = defineEmits<{
  exportJson: [];
  importJson: [];
}>();
</script>

<template>
  <section class="settings-section">
    <h3>数据管理</h3>
    <div class="btn-group">
      <button type="button" class="btn btn-secondary" @click="emit('exportJson')">导出 JSON</button>
      <button type="button" class="btn btn-secondary" @click="emit('importJson')">导入 JSON</button>
    </div>
  </section>
</template>
