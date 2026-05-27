import { App } from "vue";

import { ElDialog, ElDrawer, ElMessageBox } from "element-plus";
import * as ElementPlusIcons from "@element-plus/icons-vue";

import { configureVxeTable } from "@/plugins/vxe-table";
import VXETable from "vxe-table";

import { InstallCodeMirror } from "codemirror-editor-vue3";
import { VueQueryPlugin } from "@tanstack/vue-query";

export function registerGlobComp(app: App) {
  // 全局禁用 Element Plus Dialog/Drawer 的 lockScroll
  // 本项目滚动容器是 .app-main，body 上无滚动条
  // lockScroll 会修改 body.style.width 导致布局跳动
  ElDialog.props.lockScroll!.default = false;
  ElDrawer.props.lockScroll!.default = false;

  // 第三方插件
  configureVxeTable();
  app.use(VXETable);
  app.use(InstallCodeMirror);

  // 全局组件（Element Plus 图标）
  Object.entries(ElementPlusIcons).forEach(([name, comp]) => app.component(name, comp));
}
