<template>
  <el-dropdown trigger="click" @command="handleDarkChange">
    <el-icon :size="20">
      <component :is="settingsStore.theme === ThemeMode.DARK ? Moon : Sunny" />
    </el-icon>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in themeList"
          :key="item.value"
          :command="item.value"
          :disabled="settingsStore.theme === item.value"
        >
          <el-icon>
            <component :is="item.component" />
          </el-icon>
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores";
import { Moon, Sunny, Monitor } from "@element-plus/icons-vue";
import { ThemeMode } from "@/constants";

const { t } = useI18n();
const settingsStore = useSettingsStore();

const themeList = [
  { label: t("core.theme.light"), value: ThemeMode.LIGHT, component: Sunny },
  { label: t("core.theme.dark"), value: ThemeMode.DARK, component: Moon },
  { label: t("core.theme.auto"), value: ThemeMode.AUTO, component: Monitor },
];

const handleDarkChange = (theme: ThemeMode) => {
  settingsStore.theme = theme;
};
</script>
