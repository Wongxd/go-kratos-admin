import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { SidebarColor, LayoutMode, ComponentSize } from "@/constants";
import { defaultPreferences } from "@/settings";
import { Storage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/constants";
import { generateThemeColors, applyTheme, toggleDarkMode, toggleSidebarColor } from "@/utils/theme";

/**
 * 主题偏好设置接口
 */
export interface ThemePreferences {
  /** 主题模式 */
  theme: ThemeMode;
  /** 主题颜色 */
  themeColor: string;
  /** 侧边栏配色方案 */
  sidebarColorScheme: SidebarColor;
  /** 布局模式 */
  layout: LayoutMode;
  /** 组件尺寸 */
  size: ComponentSize;
  /** 语言 */
  language: SupportedLanguagesType;
  /** 显示标签页 */
  showTagsView: boolean;
  /** 显示应用Logo */
  showAppLogo: boolean;
  /** 显示水印 */
  showWatermark: boolean;
  /** 页面切换动画 */
  pageSwitchingAnimation: string;
  /** 显示设置面板 */
  showSettings: boolean;
  /** 水印内容 */
  watermarkContent: string;
  /** 启用刷新令牌 */
  enableRefreshToken: boolean;
  /** 登录过期模式 */
  loginExpiredMode: "modal" | "page";
  /** 访问模式 */
  accessMode: string;
  /** 启用进度条 */
  enableProgress: boolean;
}

/**
 * 主题 Store
 *
 * @description
 * 管理应用的主题设置，包括主题模式、颜色、布局等
 */
export const useThemeStore = defineStore("theme", () => {
  // 状态
  const preferences = ref<ThemePreferences>({ ...defaultPreferences });

  // 计算属性
  const isDark = computed(() => preferences.value.theme === ThemeMode.DARK);
  const currentThemeColor = computed(() => preferences.value.themeColor);
  const currentLayout = computed(() => preferences.value.layout);
  const currentSidebarColor = computed(() => preferences.value.sidebarColorScheme);
  const currentSize = computed(() => preferences.value.size);
  const currentLanguage = computed(() => preferences.value.language);

  // 初始化时从本地存储加载偏好设置
  const initPreferences = () => {
    try {
      const savedPreferences = Storage.get<Partial<ThemePreferences>>(STORAGE_KEYS.THEME_COLOR, {});
      if (savedPreferences && Object.keys(savedPreferences).length > 0) {
        preferences.value = { ...preferences.value, ...savedPreferences };
      }
    } catch (error) {
      console.error("Failed to load theme preferences:", error);
    }

    // 应用初始主题设置
    applyInitialTheme();
  };

  // 应用初始主题设置
  const applyInitialTheme = () => {
    // 应用主题颜色
    const colors = generateThemeColors(preferences.value.themeColor, preferences.value.theme);
    applyTheme(colors);

    // 应用暗黑模式
    toggleDarkMode(preferences.value.theme === ThemeMode.DARK);

    // 应用侧边栏颜色
    toggleSidebarColor(preferences.value.sidebarColorScheme === SidebarColor.CLASSIC_BLUE);
  };

  // 方法
  /**
   * 设置主题模式
   * @param theme 主题模式
   */
  const setTheme = (theme: ThemeMode) => {
    preferences.value.theme = theme;

    // 更新DOM类名
    toggleDarkMode(theme === ThemeMode.DARK);

    // 重新生成主题颜色
    const colors = generateThemeColors(preferences.value.themeColor, theme);
    applyTheme(colors);

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置主题颜色
   * @param color 主题颜色
   */
  const setThemeColor = (color: string) => {
    preferences.value.themeColor = color;

    // 生成并应用新的主题颜色
    const colors = generateThemeColors(color, preferences.value.theme);
    applyTheme(colors);

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置侧边栏配色方案
   * @param scheme 配色方案
   */
  const setSidebarColorScheme = (scheme: SidebarColor) => {
    preferences.value.sidebarColorScheme = scheme;

    // 更新侧边栏颜色类
    toggleSidebarColor(scheme === SidebarColor.CLASSIC_BLUE);

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置布局模式
   * @param layout 布局模式
   */
  const setLayout = (layout: LayoutMode) => {
    preferences.value.layout = layout;

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置组件尺寸
   * @param size 组件尺寸
   */
  const setSize = (size: ComponentSize) => {
    preferences.value.size = size;

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置语言
   * @param language 语言
   */
  const setLanguage = (language: SupportedLanguagesType) => {
    preferences.value.language = language;

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 设置其他偏好项
   * @param key 偏好键名
   * @param value 偏好值
   */
  const setPreference = <K extends keyof ThemePreferences>(key: K, value: ThemePreferences[K]) => {
    preferences.value[key] = value;

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 批量设置偏好项
   * @param newPreferences 新的偏好设置
   */
  const setPreferences = (newPreferences: Partial<ThemePreferences>) => {
    preferences.value = { ...preferences.value, ...newPreferences };

    // 应用特定设置
    if (newPreferences.theme !== undefined) {
      toggleDarkMode(newPreferences.theme === ThemeMode.DARK);
    }

    if (newPreferences.themeColor !== undefined || newPreferences.theme !== undefined) {
      const colors = generateThemeColors(
        newPreferences.themeColor || preferences.value.themeColor,
        newPreferences.theme || preferences.value.theme
      );
      applyTheme(colors);
    }

    if (newPreferences.sidebarColorScheme !== undefined) {
      toggleSidebarColor(newPreferences.sidebarColorScheme === SidebarColor.CLASSIC_BLUE);
    }

    // 保存到本地存储
    savePreferences();
  };

  /**
   * 重置为默认偏好设置
   */
  const resetPreferences = () => {
    preferences.value = { ...defaultPreferences };

    // 应用默认主题设置
    applyInitialTheme();

    // 清除本地存储
    Storage.remove(STORAGE_KEYS.THEME_COLOR);
  };

  /**
   * 保存偏好设置到本地存储
   */
  const savePreferences = () => {
    try {
      Storage.set(STORAGE_KEYS.THEME_COLOR, preferences.value);
    } catch (error) {
      console.error("Failed to save theme preferences:", error);
    }
  };

  // 初始化
  initPreferences();

  return {
    // 状态
    preferences,

    // 计算属性
    isDark,
    currentThemeColor,
    currentLayout,
    currentSidebarColor,
    currentSize,
    currentLanguage,

    // 方法
    setTheme,
    setThemeColor,
    setSidebarColorScheme,
    setLayout,
    setSize,
    setLanguage,
    setPreference,
    setPreferences,
    resetPreferences,
  };
});
