<script setup lang="ts">
defineOptions({ name: 'PaginationControls' });

const props = defineProps<{
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

function pageNumbers(): number[] {
  if (props.totalPages <= 7) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(1, props.page - 2);
  const end = Math.min(props.totalPages, props.page + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
</script>

<template>
  <div v-if="totalPages > 1" class="list-pages">
    <button class="btn btn-xs btn-secondary" :disabled="page <= 1" @click="emit('change', page - 1)">上一页</button>
    <button
      v-for="pageNumber in pageNumbers()"
      :key="pageNumber"
      class="btn btn-xs"
      :class="pageNumber === page ? 'btn-primary' : 'btn-secondary'"
      @click="emit('change', pageNumber)"
    >
      {{ pageNumber }}
    </button>
    <button class="btn btn-xs btn-secondary" :disabled="page >= totalPages" @click="emit('change', page + 1)">下一页</button>
  </div>
</template>
