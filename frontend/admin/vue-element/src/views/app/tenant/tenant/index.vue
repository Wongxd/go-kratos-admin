<template>
  <div class="app-container">
    <!-- 搜索 -->
    <PageSearch
      ref="searchRef"
      :page-search-config="pageSearchConfig"
      @query-click="handleQueryClick"
      @reset-click="handleResetClick"
    />

    <!-- 列表 -->
    <PageContent
      ref="contentRef"
      :page-content-config="pageContentConfig"
      @add-click="handleAddClick"
      @edit-click="handleEditClick"
    >
      <!-- 类型 -->
      <template #type="{ row }">
        <ElTag :color="tenantTypeToColor(row.type)">
          {{ tenantTypeToName(row.type) }}
        </ElTag>
      </template>

      <!-- 审核状态 -->
      <template #auditStatus="{ row }">
        <ElTag :color="tenantAuditStatusToColor(row.auditStatus)">
          {{ tenantAuditStatusToName(row.auditStatus) }}
        </ElTag>
      </template>

      <!-- 状态 -->
      <template #status="{ row }">
        <ElTag :color="tenantStatusToColor(row.status)">
          {{ tenantStatusToName(row.status) }}
        </ElTag>
      </template>

      <!-- 操作 -->
      <template #action="{ row }">
        <ElButton link type="primary" :icon="Edit" @click.stop="handleEditClick(row)">
          {{ $t("ui.button.edit") }}
        </ElButton>
        <ElPopconfirm
          :title="$t('ui.text.do_you_want_delete', { moduleName: $t('routes.tenant.moduleName') })"
          @confirm="handleDelete(row)"
        >
          <template #reference>
            <ElButton link type="danger" :icon="Delete">
              {{ $t("ui.button.delete") }}
            </ElButton>
          </template>
        </ElPopconfirm>
      </template>
    </PageContent>

    <!-- 新增弹窗 -->
    <PageModal ref="addModalRef" :modal-config="addModalConfig" @submit-click="handleSubmitClick">
      <!-- 分割线 -->
      <template #divider1>
        <ElDivider>{{ $t("routes.tenant.adminSetting") }}</ElDivider>
      </template>
    </PageModal>

    <!-- 编辑弹窗 -->
    <PageModal
      ref="editModalRef"
      :modal-config="editModalConfig"
      @submit-click="handleSubmitClick"
    />
  </div>
</template>

<script lang="ts" setup>
import { ElTag, ElButton, ElPopconfirm, ElMessage, ElDivider } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";

import PageContent from "@/components/CURD/PageContent.vue";
import PageSearch from "@/components/CURD/PageSearch.vue";
import PageModal from "@/components/CURD/PageModal.vue";
import usePage from "@/components/CURD/usePage";

import {
  tenantAuditStatusList,
  tenantAuditStatusToColor,
  tenantAuditStatusToName,
  tenantStatusList,
  tenantStatusToColor,
  tenantStatusToName,
  tenantTypeList,
  tenantTypeToColor,
  tenantTypeToName,
  useTenantStore,
} from "@/stores";
import type { identityservicev1_Tenant as Tenant } from "@/api/generated/admin/service/v1";
import { $t } from "@/i18n";

const tenantStore = useTenantStore();

// 使用 CURD hook
const {
  searchRef,
  contentRef,
  addModalRef,
  editModalRef,
  handleQueryClick,
  handleResetClick,
  handleAddClick,
  handleEditClick,
  handleSubmitClick,
} = usePage();

// 搜索配置
const pageSearchConfig = {
  formItems: [
    {
      type: "input",
      label: $t("routes.tenant.name"),
      prop: "name",
      attrs: {
        placeholder: $t("ui.placeholder.input"),
        clearable: true,
      },
    },
    {
      type: "input",
      label: $t("routes.tenant.code"),
      prop: "code",
      attrs: {
        placeholder: $t("ui.placeholder.input"),
        clearable: true,
      },
    },
    {
      type: "select",
      label: $t("routes.tenant.type"),
      prop: "type",
      attrs: {
        placeholder: $t("ui.placeholder.select"),
        clearable: true,
      },
      options: tenantTypeList,
    },
    {
      type: "select",
      label: $t("routes.tenant.auditStatus"),
      prop: "auditStatus",
      attrs: {
        placeholder: $t("ui.placeholder.select"),
        clearable: true,
      },
      options: tenantAuditStatusList,
    },
    {
      type: "select",
      label: $t("ui.table.status"),
      prop: "status",
      attrs: {
        placeholder: $t("ui.placeholder.select"),
        clearable: true,
      },
      options: tenantStatusList,
    },
  ],
};

// 表格配置
const pageContentConfig = {
  table: {
    border: true,
    stripe: false,
  },
  indexAction: (query: any) => {
    return tenantStore.listTenant(
      {
        page: query.page || 1,
        pageSize: query.pageSize || 10,
      },
      query
    );
  },
  props: {
    list: "items",
    total: "total",
  },
  columns: [
    { type: "index", label: $t("ui.table.seq"), width: 60 },
    { prop: "name", label: $t("routes.tenant.name"), minWidth: 120 },
    { prop: "code", label: $t("routes.tenant.code"), minWidth: 120 },
    { prop: "adminUserName", label: $t("routes.tenant.adminUserName"), minWidth: 120 },
    {
      prop: "type",
      label: $t("routes.tenant.type"),
      minWidth: 100,
      slotName: "type",
    },
    {
      prop: "auditStatus",
      label: $t("routes.tenant.auditStatus"),
      minWidth: 100,
      slotName: "auditStatus",
    },
    {
      prop: "status",
      label: $t("ui.table.status"),
      minWidth: 100,
      slotName: "status",
    },
    {
      prop: "createdAt",
      label: $t("ui.table.createdAt"),
      minWidth: 160,
      formatter: (row: any) => {
        if (!row.createdAt) return "";
        return new Date(row.createdAt).toLocaleString("zh-CN");
      },
    },
    { prop: "remark", label: $t("ui.table.remark"), minWidth: 150 },
    {
      label: $t("ui.table.action"),
      fixed: "right",
      width: 150,
      slotName: "action",
    },
  ],
};

// 新增表单配置
const addModalConfig = {
  component: "drawer" as const,
  drawer: {
    title: $t("ui.modal.create", { moduleName: $t("routes.tenant.moduleName") }),
    size: "600px",
  },
  form: {
    labelWidth: "120px",
  },
  formItems: [
    {
      type: "input",
      label: $t("routes.tenant.name"),
      prop: "name",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
    },
    {
      type: "input",
      label: $t("routes.tenant.code"),
      prop: "code",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
    },
    {
      type: "select",
      label: $t("routes.tenant.type"),
      prop: "type",
      initialValue: "PAID",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantTypeList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "select",
      label: $t("routes.tenant.auditStatus"),
      prop: "auditStatus",
      initialValue: "APPROVED",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantAuditStatusList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "select",
      label: $t("ui.table.status"),
      prop: "status",
      initialValue: "ON",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantStatusList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "input",
      label: $t("ui.table.remark"),
      prop: "remark",
      attrs: {
        type: "textarea",
        rows: 3,
        placeholder: $t("ui.placeholder.input"),
      },
    },
    // 管理员设置（仅新增时显示）
    {
      type: "custom",
      label: "",
      prop: "divider1",
      slotName: "divider1",
      hidden: true,
    },
    {
      type: "input",
      label: $t("routes.tenant.adminUserName"),
      prop: "user.username",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
      hidden: true,
    },
    {
      type: "input",
      label: $t("routes.tenant.adminPassword"),
      prop: "password",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        type: "password",
        showPassword: true,
        placeholder: $t("ui.placeholder.input"),
      },
      hidden: true,
    },
    {
      type: "input",
      label: $t("routes.tenant.adminPasswordConfirm"),
      prop: "passwordConfirm",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        type: "password",
        showPassword: true,
        placeholder: $t("ui.placeholder.input"),
      },
      hidden: true,
    },
    {
      type: "input",
      label: $t("routes.tenant.adminMobile"),
      prop: "user.mobile",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
      hidden: true,
    },
    {
      type: "input",
      label: $t("routes.tenant.adminEmail"),
      prop: "user.email",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
      hidden: true,
    },
  ],
  beforeSubmit: async (data: any) => {
    // 检查密码和确认密码是否一致
    if (data.password !== data.passwordConfirm) {
      ElMessage.error($t("pages.notification.password_mismatch"));
      throw new Error("Password mismatch");
    }

    // 检查租户编码是否存在
    try {
      await tenantStore.tenantExists(data.code, data.name);
    } catch {
      ElMessage.error($t("pages.tenant.tenant_code_exists"));
      throw new Error("Tenant code exists");
    }

    // 检查用户名是否存在
    try {
      // TODO: 需要实现用户存在性检查
      // await userListStore.userExists(data.user.username);
    } catch {
      ElMessage.error($t("pages.tenant.notification.user_username_exists"));
      throw new Error("User username exists");
    }

    // 调用创建接口
    await tenantStore.createTenantWithAdminUser({
      tenant: {
        name: data.name,
        code: data.code,
        type: data.type,
        auditStatus: data.auditStatus,
        status: data.status,
        remark: data.remark,
      },
      user: data.user,
      password: data.password,
    });
  },
};

// 编辑表单配置
const editModalConfig = {
  component: "drawer" as const,
  drawer: {
    title: $t("ui.modal.update", { moduleName: $t("routes.tenant.moduleName") }),
    size: "600px",
  },
  form: {
    labelWidth: "120px",
  },
  formItems: [
    {
      type: "input",
      label: $t("routes.tenant.name"),
      prop: "name",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
    },
    {
      type: "input",
      label: $t("routes.tenant.code"),
      prop: "code",
      rules: [{ required: true, message: $t("ui.placeholder.input"), trigger: "blur" }],
      attrs: {
        placeholder: $t("ui.placeholder.input"),
      },
    },
    {
      type: "select",
      label: $t("routes.tenant.type"),
      prop: "type",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantTypeList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "select",
      label: $t("routes.tenant.auditStatus"),
      prop: "auditStatus",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantAuditStatusList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "select",
      label: $t("ui.table.status"),
      prop: "status",
      rules: [{ required: true, message: $t("ui.placeholder.select"), trigger: "change" }],
      options: tenantStatusList,
      attrs: {
        placeholder: $t("ui.placeholder.select"),
      },
    },
    {
      type: "input",
      label: $t("ui.table.remark"),
      prop: "remark",
      attrs: {
        type: "textarea",
        rows: 3,
        placeholder: $t("ui.placeholder.input"),
      },
    },
  ],
  beforeSubmit: async (data: any) => {
    await tenantStore.updateTenant(data.id, data);
  },
};

// 处理删除
async function handleDelete(row: Tenant) {
  try {
    await tenantStore.deleteTenant(row.id);
    ElMessage.success($t("ui.notification.delete_success"));
    contentRef.value?.fetchPageData({}, true);
  } catch {
    ElMessage.error($t("ui.notification.delete_failed"));
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}
</style>
