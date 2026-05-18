import { defineStore } from "pinia";
import { ref, computed } from "vue";

import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";

import { defaultPreferences } from "@/settings";
import { StorageManager } from "@/utils/storage";
import { APP_PREFIX, STORAGE_KEYS } from "@/constants";
import { loadLocaleMessages } from "@/i18n";

// 创建语言存储管理器实例
const languageStorage = new StorageManager({
  prefix: APP_PREFIX,
  storageType: "localStorage",
});

/**
 * 语言 Store
 *
 * @description
 * 管理应用的语言设置，包括当前语言、可用语言列表等
 */
export const useLanguageStore = defineStore("language", () => {
  // 状态
  const currentLanguage = ref<SupportedLanguagesType>(defaultPreferences.language);

  // Element Plus 语言包映射
  const elementPlusLocales = {
    "zh-cn": zhCn,
    "en-US": en,
  };

  // 可用语言列表
  const availableLanguages = [
    { code: "zh-cn" as SupportedLanguagesType, name: "简体中文", locale: "zh-CN" },
    { code: "en-US" as SupportedLanguagesType, name: "English", locale: "en-US" },
  ];

  // 计算属性
  const currentLocaleName = computed(() => {
    const lang = availableLanguages.find((lang) => lang.code === currentLanguage.value);
    return lang ? lang.name : "简体中文";
  });

  /**
   * 获取 Element Plus 语言包
   * @returns Element Plus 语言配置对象
   */
  const getElementPlusLocale = computed(() => {
    return elementPlusLocales[currentLanguage.value] || zhCn;
  });

  // 初始化时从本地存储加载语言设置
  const initLanguage = async () => {
    try {
      const savedLanguage = languageStorage.getItem<SupportedLanguagesType>(STORAGE_KEYS.LANGUAGE);
      if (savedLanguage && isValidLanguage(savedLanguage)) {
        currentLanguage.value = savedLanguage;
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    }

    // 应用初始语言设置
    await applyLanguage(currentLanguage.value);
  };

  /**
   * 验证语言代码是否有效
   * @param lang 语言代码
   * @returns 是否为有效语言
   */
  const isValidLanguage = (lang: string): lang is SupportedLanguagesType => {
    return ["zh-cn", "en-US"].includes(lang);
  };

  /**
   * 应用语言设置
   * @param lang 语言代码
   */
  const applyLanguage = async (lang: SupportedLanguagesType) => {
    try {
      // 更新 i18n 实例的语言
      await loadLocaleMessages(lang);

      // 更新 HTML lang 属性
      document.documentElement.lang = lang;

      // 保存到本地存储
      saveLanguage(lang);
    } catch (error) {
      console.error("Failed to apply language:", error);
    }
  };

  /**
   * 设置语言
   * @param lang 语言代码
   */
  const setLanguage = async (lang: SupportedLanguagesType) => {
    if (!isValidLanguage(lang)) {
      console.warn(`Invalid language: ${lang}`);
      return;
    }

    if (currentLanguage.value === lang) {
      return; // 如果已经是当前语言，则无需更改
    }

    currentLanguage.value = lang;
    await applyLanguage(lang);
  };

  /**
   * 获取语言名称
   * @param langCode 语言代码
   * @returns 语言名称
   */
  const getLanguageName = (langCode: SupportedLanguagesType): string => {
    const lang = availableLanguages.find((lang) => lang.code === langCode);
    return lang ? lang.name : "未知语言";
  };

  /**
   * 保存语言设置到本地存储
   * @param lang 语言代码
   */
  const saveLanguage = (lang: SupportedLanguagesType) => {
    try {
      languageStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  /**
   * 重置为默认语言
   */
  const resetLanguage = async () => {
    currentLanguage.value = defaultPreferences.language;
    await applyLanguage(defaultPreferences.language);

    // 清除本地存储
    languageStorage.removeItem(STORAGE_KEYS.LANGUAGE);
  };

  // 初始化
  initLanguage();

  return {
    // 状态
    currentLanguage,
    availableLanguages,

    // 计算属性
    currentLocaleName,
    getElementPlusLocale,

    // 方法
    setLanguage,
    getLanguageName,
    resetLanguage,
  };
});
