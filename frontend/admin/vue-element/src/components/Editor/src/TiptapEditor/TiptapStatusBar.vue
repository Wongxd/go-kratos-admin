<template>
  <div
    class="absolute bottom-3 right-4 flex items-center gap-2 text-xs select-none pointer-events-none"
    :class="
      isDark
        ? 'text-[#626773]'
        : 'text-[#94a3b8]'
    "
  >
    <span>{{ statusInfo.words }} {{ $t("common.editor.words") }}</span>
    <span :class="isDark ? 'text-[var(--tte-toolbar-border)]' : 'text-[#cbd5e1]'">|</span>
    <span>{{ statusInfo.chars }} {{ $t("common.editor.chars") }}</span>
    <span :class="isDark ? 'text-[var(--tte-toolbar-border)]' : 'text-[#cbd5e1]'">|</span>
    <span>Ln {{ statusInfo.cursor }}</span>
    <span
      class="px-2 py-0.5 text-[11px] rounded"
      :class="isDark ? 'text-[#626773] bg-[rgba(255,255,255,0.06)]' : 'text-[#94a3b8] bg-[#f1f5f9]'"
    >
      MD
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isDark: boolean;
  statusInfo: { chars: number; words: number; cursor: string };
}>();
</script>
