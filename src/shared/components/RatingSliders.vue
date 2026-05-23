<script setup lang="ts">
import { computed } from 'vue';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import { calcTotal } from '../scoring.js';
import type { RatingDims } from '../../types/domain.js';

defineOptions({ name: 'RatingSliders' });

const props = withDefaults(defineProps<{
  modelValue: RatingDims;
  prefix?: string;
  readonly?: boolean;
}>(), {
  prefix: 'vue',
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [ratings: RatingDims];
}>();

const dims = Object.keys(WEIGHTS) as RatingDim[];
const total = computed(() => calcTotal(props.modelValue));

function updateDim(dim: RatingDim, value: string): void {
  emit('update:modelValue', {
    ...props.modelValue,
    [dim]: Number.parseInt(value, 10),
  });
}
</script>

<template>
  <div>
    <div class="dim-list">
      <div v-for="dim in dims" :key="dim" class="dim-row">
        <div class="dim-info">
          <div class="dim-name">{{ DIM_LABELS[dim] }}</div>
          <div class="dim-weight">权重 {{ WEIGHTS[dim] * 100 }}%</div>
        </div>
        <div class="dim-slider">
          <input
            type="range"
            min="1"
            max="10"
            :value="modelValue[dim] || 5"
            :data-prefix="prefix"
            :data-dim="dim"
            :aria-label="DIM_LABELS[dim]"
            :aria-valuenow="modelValue[dim] || 5"
            aria-valuemin="1"
            aria-valuemax="10"
            :disabled="readonly"
            @input="updateDim(dim, ($event.target as HTMLInputElement).value)"
          >
          <span class="dim-score" :data-prefix="prefix" :data-dim="dim">{{ modelValue[dim] || 5 }}</span>
        </div>
      </div>
    </div>
    <div class="total-preview">
      <span class="total-label">加权总分</span>
      <span class="total-value">{{ total.toFixed(1) }}</span>
    </div>
  </div>
</template>
