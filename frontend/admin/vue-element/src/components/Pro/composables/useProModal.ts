import type { Component } from "vue";
import { defineComponent, h, inject, onBeforeUnmount, provide, reactive } from "vue";
import type { Ref } from "vue";
import { Store, useSelector } from "@tanstack/vue-store";
import { bindMethods, isFunction, mergeWithArrayOverride } from "@/utils";
import type { ProModalConfig, ModalMode } from "../ProModal/types";

// ==================== ModalApi ====================

export interface ProModalState {
  isOpen: boolean;
  confirmLoading: boolean;
  title: string;
  /** 共享数据（传递给 connectedComponent） */
  sharedData: Record<string, any>;
}

function getDefaultModalState(): ProModalState {
  return {
    isOpen: false,
    confirmLoading: false,
    title: "",
    sharedData: {},
  };
}

export class ProModalApi {
  private state!: ProModalState;
  private onCloseCallback?: () => void;
  private onConfirmCallback?: () => Promise<void>;

  public store: Store<ProModalState>;

  constructor(options?: {
    onConfirm?: () => Promise<void>;
    onClose?: () => void;
  }) {
    this.onConfirmCallback = options?.onConfirm;
    this.onCloseCallback = options?.onClose;

    this.store = new Store<ProModalState>(getDefaultModalState());

    this.store.subscribe(() => {
      this.state = this.store.state;
    });

    this.state = this.store.state;
    bindMethods(this);
  }

  /** 打开弹窗，可传递共享数据 */
  open(data?: Record<string, any>) {
    if (data) {
      this.store.setState((prev) => ({
        ...prev,
        sharedData: { ...prev.sharedData, ...data },
        isOpen: true,
      }));
    } else {
      this.store.setState((prev) => ({ ...prev, isOpen: true }));
    }
  }

  /** 关闭弹窗 */
  close() {
    this.store.setState((prev) => ({ ...prev, isOpen: false }));
  }

  /** 获取共享数据 */
  getData<T extends Record<string, any> = Record<string, any>>(): T {
    return (this.state?.sharedData ?? {}) as T;
  }

  /** 设置共享数据 */
  setData(data: Record<string, any>) {
    this.store.setState((prev) => ({
      ...prev,
      sharedData: { ...prev.sharedData, ...data },
    }));
  }

  /** 设置确认按钮加载状态 */
  setLoading(loading: boolean) {
    this.store.setState((prev) => ({ ...prev, confirmLoading: loading }));
  }

  /** 设置标题 */
  setTitle(title: string) {
    this.store.setState((prev) => ({ ...prev, title }));
  }

  /** 响应式更新状态 */
  setState(
    stateOrFn:
      | ((prev: ProModalState) => Partial<ProModalState>)
      | Partial<ProModalState>,
  ) {
    if (isFunction(stateOrFn)) {
      this.store.setState((prev: ProModalState) =>
        mergeWithArrayOverride(stateOrFn(prev), prev) as ProModalState,
      );
    } else {
      this.store.setState((prev: ProModalState) =>
        mergeWithArrayOverride(stateOrFn, prev) as ProModalState,
      );
    }
  }

  /** 确认操作 */
  async onConfirm() {
    await this.onConfirmCallback?.();
  }

  /** 取消/关闭操作 */
  onCancel() {
    this.onCloseCallback?.();
    this.close();
  }

  /** 获取 Store 状态的响应式引用 */
  useStore<T = ProModalState>(
    selector?: (state: NoInfer<ProModalState>) => T,
  ): Readonly<Ref<T>> {
    return useSelector(this.store, selector ?? ((s: any) => s));
  }

  /** 重置共享数据 */
  resetData() {
    this.store.setState((prev) => ({ ...prev, sharedData: {} }));
  }
}

// ==================== useProModal ====================

const PRO_MODAL_INJECT_KEY = Symbol("PRO_MODAL_INJECT");

export interface UseProModalOptions {
  /** 连接的外部组件（弹窗内容组件） */
  connectedComponent?: Component;
  /** 确认回调 */
  onConfirm?: () => Promise<void>;
  /** 关闭回调 */
  onClose?: () => void;
  /** 弹窗打开变化回调 */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * useProModal —— 弹窗命令式控制 + connectedComponent 抽离
 *
 * @example
 * ```ts
 * // 列表页：使用 connectedComponent 连接弹窗组件
 * const [Modal, modalApi] = useProModal({
 *   connectedComponent: UserDrawer,
 *   onOpenChange(isOpen) {
 *     if (!isOpen) pageApi.reload();
 *   },
 * });
 *
 * function handleAdd() {
 *   modalApi.open({ create: true });
 * }
 * function handleEdit(row: any) {
 *   modalApi.open({ create: false, row });
 * }
 * ```
 *
 * ```vue
 * <template>
 *   <Page />
 *   <Modal />
 * </template>
 * ```
 *
 * @example
 * ```ts
 * // 弹窗组件内部：通过 inject 获取 api
 * const modalApi = injectProModalApi();
 * const data = modalApi.getData();
 * ```
 */
export function useProModal(options: UseProModalOptions = {}) {
  const { connectedComponent } = options;

  // === connectedComponent 模式：provide/inject 桥接 ===
  if (connectedComponent) {
    const extendedApi = reactive({}) as ProModalApi;

    const Modal = defineComponent(
      (props: Record<string, any>, { attrs, slots }) => {
        provide(PRO_MODAL_INJECT_KEY, {
          extendApi(api: ProModalApi) {
            Object.setPrototypeOf(extendedApi, api);
          },
          options,
        });
        return () => h(connectedComponent, { ...props, ...attrs }, slots);
      },
      { name: "ProModalWrapper", inheritAttrs: false },
    );

    return [Modal, extendedApi] as const;
  }

  // === 非 connectedComponent 模式：直接创建 Api ===
  const api = new ProModalApi({
    onConfirm: options.onConfirm,
    onClose: options.onClose,
  });

  return [null as null, api] as const;
}

/**
 * 在 connectedComponent 内部注入 ProModalApi
 *
 * @example
 * ```ts
 * // UserDrawer.vue（弹窗内容组件）
 * const modalApi = injectProModalApi();
 * const data = modalApi.getData();
 * ```
 */
export function injectProModalApi(): ProModalApi {
  const injectData = inject<any>(PRO_MODAL_INJECT_KEY, {});

  // 创建内部 ModalApi
  const api = new ProModalApi({
    onConfirm: injectData.options?.onConfirm,
    onClose: injectData.options?.onClose,
  });

  // 连接到外部 extendedApi
  injectData.extendApi?.(api);

  return api;
}

export type UseProModal = typeof useProModal;
