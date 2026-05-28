/**
 * ProTable 单元格渲染器注册表
 *
 * 提供可扩展的 cellType → 渲染组件映射机制。
 * 内置所有标准渲染器，业务可通过 registerCellRenderer() 注册自定义类型。
 *
 * @example
 * ```ts
 * import { registerCellRenderer } from './cellRendererRegistry';
 * import MyStatusCell from './MyStatusCell.vue';
 *
 * registerCellRenderer('status', defineComponent({
 *   props: { col: Object, row: Object, field: String, rowIndex: Number },
 *   setup(props) { ... }
 * }));
 * ```
 *
 * 自定义渲染组件接收统一 props：
 * - col: ProTableColumn  列配置
 * - row: any             行数据
 * - field: string        字段名（col.prop）
 * - rowIndex: number     行索引
 *
 * 可选 emits（由 ProTableCellContent 转发）：
 * - modify({ row, field, value })
 * - operate({ name, row, $index })
 */
import { defineComponent, h } from "vue";
import type { Component, FunctionalComponent } from "vue";
import { useDateFormat } from "@vueuse/core";
import { ElImage, ElTag, ElSwitch, ElLink, ElIcon, ElTooltip, ElButton } from "element-plus";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { AccessControl } from "@/core/access";
import type { ProTableColumn } from "./types";

// ============================================
// 渲染器上下文 — 传递给每个渲染器的统一 props
// ============================================

export interface CellRendererContext {
  /** 列配置 */
  col: ProTableColumn;
  /** 行数据 */
  row: any;
  /** 字段名 */
  field: string;
  /** 行索引 */
  rowIndex: number;
}

// ============================================
// 工具函数
// ============================================

/** 根据 tagTypeMap / tagType / value 推断 ElTag type */
function getTagType(
  value: any,
  col: ProTableColumn,
): "primary" | "success" | "warning" | "danger" | "info" {
  if (col.tagTypeMap && value != null) {
    return (col.tagTypeMap as Record<string, any>)[value] ?? "info";
  }
  if (col.tagType) return col.tagType as any;
  return value ? "success" : "danger";
}

/** 根据 btn.attrs.type 映射图标按钮颜色变体 */
function getIconBtnVariant(btn: Record<string, any>): string {
  const type = btn.attrs?.type;
  if (type === "danger") return "danger";
  if (type === "success") return "success";
  if (type === "warning") return "warning";
  return "primary";
}

// ============================================
// 内置渲染器
// ============================================

/** 图片渲染器 */
const ImageCell: FunctionalComponent<CellRendererContext> = ({ col, row, field }) => {
  if (!field) return null;
  const val = row[field];
  const style = `width: ${col.imageWidth ?? 40}px; height: ${col.imageHeight ?? 40}px`;

  if (Array.isArray(val)) {
    return h("template", [
      val.map((item: string, idx: number) =>
        h(ElImage, {
          src: item,
          previewSrcList: val,
          initialIndex: idx,
          previewTeleported: true,
          style,
        }),
      ),
    ]);
  }

  return h(ElImage, {
    src: val,
    previewSrcList: [val],
    previewTeleported: true,
    style,
  });
};

/** 标签渲染器 */
const TagCell: FunctionalComponent<CellRendererContext> = ({ col, row, field }) => {
  return h(ElTag, { type: getTagType(row[field], col) }, () => {
    return ((col.labelMap ?? {}) as Record<string, any>)[row[field]] ?? row[field];
  });
};

/** 开关渲染器 — 需要事件，使用 defineComponent */
const SwitchCell = defineComponent({
  name: "SwitchCell",
  props: {
    col: { type: Object, required: true },
    row: { type: Object, required: true },
    field: { type: String, required: true },
    rowIndex: { type: Number, required: true },
  },
  emits: ["modify"],
  setup(props, { emit }) {
    return () => {
      if (!props.field) return null;
      return h(ElSwitch, {
        modelValue: props.row[props.field],
        "onUpdate:modelValue": (val: any) => {
          props.row[props.field] = val;
          emit("modify", { row: props.row, field: props.field, value: val });
        },
        activeValue: props.col.activeValue ?? 1,
        inactiveValue: props.col.inactiveValue ?? 0,
        inlinePrompt: true,
        activeText: props.col.activeText ?? "",
        inactiveText: props.col.inactiveText ?? "",
        validateEvent: false,
      });
    };
  },
});

/** 日期渲染器 */
const DateCell: FunctionalComponent<CellRendererContext> = ({ col, row, field }) => {
  return row[field] ? useDateFormat(row[field], col.dateFormat ?? "YYYY-MM-DD HH:mm:ss").value : "";
};

/** 链接渲染器 */
const LinkCell: FunctionalComponent<CellRendererContext> = ({ row, field }) => {
  return h(ElLink, { type: "primary", href: row[field], target: "_blank" }, () => row[field]);
};

/** 价格渲染器 */
const PriceCell: FunctionalComponent<CellRendererContext> = ({ col, row, field }) => {
  return `${col.pricePrefix ?? ""}${row[field]}`;
};

/** 百分比渲染器 */
const PercentCell: FunctionalComponent<CellRendererContext> = ({ row, field }) => {
  return `${row[field]}%`;
};

/** 图标渲染器 */
const IconCell: FunctionalComponent<CellRendererContext> = ({ row, field }) => {
  return h(ElIcon, () => h(row[field]));
};

/** 操作列渲染器 */
const ToolCell = defineComponent({
  name: "ToolCell",
  props: {
    col: { type: Object, required: true },
    row: { type: Object, required: true },
    field: { type: String, required: true },
    rowIndex: { type: Number, required: true },
  },
  emits: ["operate"],
  setup(props, { emit }) {
    return () => {
      const buttons = props.col.buttons ?? [];
      return h("template", [
        buttons.map((btn: Record<string, any>, idx: number) => {
          const codes = btn.auth
            ? Array.isArray(btn.auth)
              ? btn.auth
              : [btn.auth]
            : undefined;

          const visible = btn.visible === undefined || btn.visible(props.row);

          const content = h(
            ElTooltip,
            {
              content: btn.label ?? btn.name,
              placement: "top",
              showAfter: 300,
            },
            {
              default: () =>
                btn.icon
                  ? h(
                      "button",
                      {
                        class: ["table-icon-btn", `table-icon-btn--${getIconBtnVariant(btn)}`],
                        onClick: () =>
                          emit("operate", { name: btn.name, row: props.row, $index: props.rowIndex }),
                      },
                      [h(SvgIcon, { icon: btn.icon, size: 16 })],
                    )
                  : h(
                      ElButton,
                      {
                        link: true,
                        size: "small",
                        ...btn.attrs,
                        onClick: () =>
                          emit("operate", { name: btn.name, row: props.row, $index: props.rowIndex }),
                      },
                      () => btn.label ?? btn.name,
                    ),
            },
          );

          return h(
            AccessControl,
            { codes },
            () => (visible ? content : null),
          );
        }),
      ]);
    };
  },
});

/** 默认文本渲染器 */
const TextCell: FunctionalComponent<CellRendererContext> = ({ row, field }) => {
  return field ? row[field] : "";
};

// ============================================
// 注册表
// ============================================

type CellRenderer = Component<CellRendererContext>;

const registry = new Map<string, CellRenderer>();

/** 注册一个 cellType 渲染器。同名覆盖。 */
export function registerCellRenderer(type: string, renderer: CellRenderer): void {
  registry.set(type, renderer);
}

/** 获取渲染器，未找到返回 undefined */
export function getCellRenderer(type: string): CellRenderer | undefined {
  return registry.get(type);
}

/** 判断某 cellType 是否已注册 */
export function hasCellRenderer(type: string): boolean {
  return registry.has(type);
}

/** 获取所有已注册类型（调试用） */
export function getRegisteredCellTypes(): string[] {
  return [...registry.keys()];
}

// ============================================
// 注册内置渲染器
// ============================================

registerCellRenderer("image", ImageCell);
registerCellRenderer("tag", TagCell);
registerCellRenderer("switch", SwitchCell);
registerCellRenderer("date", DateCell);
registerCellRenderer("link", LinkCell);
registerCellRenderer("price", PriceCell);
registerCellRenderer("percent", PercentCell);
registerCellRenderer("icon", IconCell);
registerCellRenderer("tool", ToolCell);
registerCellRenderer("text", TextCell);
