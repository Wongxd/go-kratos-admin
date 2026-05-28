<template>
  <!--
    动态组件渲染：通过注册表查找 cellType 对应的渲染组件
    未注册类型回退为纯文本显示
  -->
  <component
    :is="renderer"
    v-if="renderer"
    :col="col"
    :row="row"
    :field="field"
    :row-index="rowIndex"
    @modify="(d: any) => emit('modify', d)"
    @operate="(d: any) => emit('operate', d)"
  />
  <template v-else>
    {{ field ? row[field] : "" }}
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import { getCellRenderer } from "./cellRendererRegistry";
import type { ProTableColumn } from "./types";

const props = defineProps<{
  col: ProTableColumn;
  row: any;
  rowIndex: number;
}>();

const emit = defineEmits<{
  modify: [data: { row: any; field: string; value: any }];
  operate: [data: { name: string; row: any; $index: number }];
}>();

const field = computed(() => props.col.prop ?? "");

/** 从注册表查找 cellType 对应的渲染组件 */
const renderer = computed<Component | undefined>(() => {
  const type = props.col.cellType;
  if (!type || type === "custom") return undefined;
  return getCellRenderer(type);
});
</script>
