<script setup lang="ts">
defineOptions({ name: 'PaginationControls' });

const props = defineProps<{
  page: number;
  totalPages: number;
  variant?: 'list' | 'discover';
  kind?: 'list' | 'watchlist' | 'blocked' | 'discover';
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

function pageItems(): Array<number | '...'> {
  if (props.totalPages <= 5) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1);
  }
  const items: Array<number | '...'> = [1];
  let start = 2;
  let end = 4;
  if (props.page <= 3) {
    start = 2;
    end = 4;
  } else if (props.page >= props.totalPages - 2) {
    start = props.totalPages - 3;
    end = props.totalPages - 1;
  } else {
    start = props.page - 1;
    end = props.page + 1;
  }
  if (start > 2) items.push('...');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < props.totalPages - 1) items.push('...');
  items.push(props.totalPages);
  return items;
}

function changePage(page: number): void {
  if (page < 1 || page > props.totalPages || page === props.page) return;
  emit('change', page);
}

function pageAttrs(page: number): Record<string, number> {
  const attr = props.kind === 'watchlist'
    ? 'data-wl-pg'
    : props.kind === 'blocked'
      ? 'data-bl-pg'
      : props.kind === 'discover'
        ? 'data-pg'
        : 'data-lp-pg';
  return { [attr]: page };
}
</script>

<template>
  <div v-if="totalPages > 1" :class="variant === 'discover' ? 'discover-pages' : 'list-pages'">
    <button type="button" v-bind="pageAttrs(page - 1)" :disabled="page <= 1" aria-label="上一页" @click="changePage(page - 1)">‹</button>
    <template v-for="(item, index) in pageItems()" :key="`${item}-${index}`">
      <span v-if="item === '...'" class="pagination-ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        v-bind="pageAttrs(item)"
        :class="{ active: item === page }"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="item === page ? undefined : `第 ${item} 页`"
        @click="changePage(item)"
      >
        {{ item }}
      </button>
    </template>
    <button type="button" v-bind="pageAttrs(page + 1)" :disabled="page >= totalPages" aria-label="下一页" @click="changePage(page + 1)">›</button>
  </div>
</template>
