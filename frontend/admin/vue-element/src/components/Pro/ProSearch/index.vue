<template>
  <div v-show="visible" class="pro-search">
    <ElForm
      ref="formRef"
      :model="queryParams"
      :inline="inline"
      v-bind="formAttrs"
      :class="formClass"
    >
      <template v-for="(field, index) in fields" :key="field.field">
        <ElFormItem
          v-show="!isFieldHidden(index)"
          :label="field.label"
          :prop="String(field.field)"
        >
          <template #label>
            <span class="flex items-center gap-1">
              {{ field.label }}
              <ElTooltip
                v-if="field.tips"
                :content="typeof field.tips === 'string' ? field.tips : ''"
                placement="top"
              >
                <ElIcon class="text-gray-400"><QuestionFilled /></ElIcon>
              </ElTooltip>
              <span v-if="colon" class="ml-0.5">:</span>
            </span>
          </template>

          <!-- 自定义插槽 -->
          <slot
            v-if="field.slotName || field.type === 'custom'"
            :name="field.slotName ?? field.field"
            :model="queryParams"
            :field="field.field"
            :attrs="{ style: { width: '100%' }, ...field.attrs }"
          />

          <!-- api-tree-select -->
          <ElTreeSelect
            v-else-if="field.type === 'api-tree-select'"
            v-model="queryParams[field.field]"
            v-bind="{ style: { width: '100%' }, clearable: true, ...field.attrs }"
          />

          <!-- 动态组件 -->
          <component
            :is="getComponent(field.type)"
            v-else
            v-model="queryParams[field.field]"
            v-bind="{ style: { width: '100%' }, clearable: true, ...field.attrs }"
            @keyup.enter="handleSearch"
          >
            <template v-if="['select', 'radio', 'checkbox'].includes(field.type ?? '')">
              <component
                :is="
                  field.type === 'select'
                    ? ElOption
                    : field.type === 'radio'
                      ? ElRadio
                      : ElCheckbox
                "
                v-for="opt in field.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
                :disabled="opt.disabled"
              />
            </template>
          </component>
        </ElFormItem>
      </template>

      <!-- 操作按钮区域 -->
      <div :class="actionClass">
        <ElButton
          v-if="showSearchButton"
          type="primary"
          :icon="Search"
          :loading="searching"
          @click="handleSearch"
        >
          {{ searchButtonText }}
        </ElButton>

        <ElButton v-if="showResetButton" :icon="Refresh" @click="handleReset">
          {{ resetButtonText }}
        </ElButton>

        <!-- 展开/收起 -->
        <span
          v-if="isExpandable && hasHiddenFields"
          class="pro-search__collapse-btn"
          @click="toggleExpand"
        >
          {{ expanded ? t("common.button.collapse") : t("common.button.expand") }}
          <ElIcon class="ml-1">
            <component :is="expanded ? ArrowUp : ArrowDown" />
          </ElIcon>
        </span>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, reactive, onMounted, nextTick, markRaw, h } from "vue";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElRadio,
  ElCheckbox,
  ElCascader,
  ElTreeSelect,
  ElDatePicker,
  ElTimePicker,
  ElTimeSelect,
  ElButton,
  ElIcon,
  ElTooltip,
} from "element-plus";
import { Search, Refresh, ArrowUp, ArrowDown, QuestionFilled } from "@element-plus/icons-vue";
import InputTag from "@/components/InputTag/index.vue";
import { useI18n } from "@/i18n";
import type { ProSearchConfig, ProSearchEmits } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ProSearchConfig<T>>(), {
  colon: false,
  inline: true,
  isExpandable: true,
  showNumber: 3,
  showSearchButton: true,
  showResetButton: true,
  searchButtonText: "搜索",
  resetButtonText: "重置",
});

const emit = defineEmits<ProSearchEmits<T>>();
const { t } = useI18n();

const formRef = ref<InstanceType<typeof ElForm>>();
const queryParams = reactive<Record<string, any>>({});
const expanded = ref(false);
const searching = ref(false);
const visible = ref(true);

// 判断字段是否应隐藏（收起模式下，超出 showNumber 的字段用 CSS hidden 隐藏）
function isFieldHidden(index: number): boolean {
  if (!props.isExpandable || expanded.value) return false;
  return index >= (props.showNumber ?? 3);
}

// 是否有可展开的隐藏字段
const hasHiddenFields = computed(() => props.fields.length > (props.showNumber ?? 3));

// 表单属性
const formAttrs = computed<Record<string, any>>(() => ({
  labelPosition: "right" as const,
  labelWidth: "auto",
  size: "default",
  ...props.form,
}));

// 按钮区域 class（参考 Vben rowEnd 模式：按钮在 grid 行末对齐）
const actionClass = computed(() => {
  const cls = ["pro-search__actions"];
  if (props.grid) {
    cls.push("pro-search__actions--grid");
  }
  return cls;
});

// 表单 class（响应式 Grid 布局，参考 Vben）
const formClass = computed(() => {
  if (props.grid) {
    return "pro-search--grid";
  }
  return "pro-search--inline";
});

// 动态解析组件
const getComponent = (type?: string) => {
  const map: Record<string, any> = {
    input: markRaw(ElInput),
    select: markRaw(ElSelect),
    "input-number": markRaw(ElInputNumber),
    "date-picker": markRaw(ElDatePicker),
    "time-picker": markRaw(ElTimePicker),
    "time-select": markRaw(ElTimeSelect),
    cascader: markRaw(ElCascader),
    "tree-select": markRaw(ElTreeSelect),
    "input-tag": markRaw(InputTag),
    "custom-tag": markRaw(InputTag),
    date: markRaw(ElDatePicker),
    datetime: () => h(ElDatePicker, { type: "datetime" }),
    daterange: () => h(ElDatePicker, { type: "daterange" }),
    number: markRaw(ElInputNumber),
  };
  return map[type ?? "input"] || ElInput;
};
// 搜索
async function handleSearch() {
  try {
    searching.value = true;
    // 过滤空值
    const params = {} as Record<string, any>;
    Object.keys(queryParams).forEach((key) => {
      const val = queryParams[key];
      if (val !== "" && val !== null && val !== undefined) {
        params[key] = val;
      }
    });
    emit("search", params as T);
  } finally {
    searching.value = false;
  }
}

// 重置
function handleReset() {
  formRef.value?.resetFields();
  nextTick(() => formRef.value?.clearValidate());
  // 恢复初始值
  props.fields.forEach((field) => {
    if (field.initialValue !== undefined) {
      (queryParams as any)[field.field] = field.initialValue;
    }
  });
  emit("reset", { ...queryParams } as T);
}

// 展开/收起
function toggleExpand() {
  expanded.value = !expanded.value;
  emit("expand", expanded.value);
}

// 初始化
onMounted(() => {
  props.fields.forEach((field) => {
    if (field.initFn) field.initFn(field as any);
    // api-tree-select: 异步加载数据
    if (field.type === "api-tree-select" && typeof field.api === "function") {
      field.api().then((data) => {
        if (!field.attrs) field.attrs = {};
        field.attrs.data = data;
      });
    }
    // 初始值
    if (["input-tag", "custom-tag", "cascader"].includes(field.type ?? "")) {
      (queryParams as any)[field.field] = Array.isArray(field.initialValue)
        ? field.initialValue
        : [];
    } else if (field.type === "input-number" || field.type === "number") {
      (queryParams as any)[field.field] = field.initialValue ?? null;
    } else {
      (queryParams as any)[field.field] = field.initialValue ?? "";
    }
  });
});

// 暴露方法
defineExpose({
  queryParams,
  formRef,
  visible,
  expanded,
  toggleVisible: () => {
    visible.value = !visible.value;
  },
  toggleExpand,
  reset: handleReset,
  search: handleSearch,
  setQueryParams: (params: Partial<T>) => {
    Object.assign(queryParams, params);
  },
});
</script>

<style lang="scss" scoped>
.pro-search {
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

// === Grid 布局模式（参考 Vben） ===
.pro-search--grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }

  // 让表单项内容拉伸
  :deep(.el-form-item__content) {
    flex: 1;
    min-width: 0;
    width: 100%;
  }
}

// === Inline 布局模式 ===
.pro-search--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0 24px;
}

// === 操作按钮区域 ===
.pro-search__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

// Grid 模式下按钮靠右对齐
.pro-search__actions--grid {
  grid-column: -2 / -1;
  justify-self: end;
  align-self: end;
}

// === 展开/收起按钮 ===
.pro-search__collapse-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 13px;
  user-select: none;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }
}

// === 通用重置 ===
:deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
