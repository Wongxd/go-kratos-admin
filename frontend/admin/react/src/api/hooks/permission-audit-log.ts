import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  type auditservicev1_GetPermissionAuditLogRequest,
  type auditservicev1_ListPermissionAuditLogResponse,
  type auditservicev1_PermissionAuditLog,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import { listPermissionAuditLogs, getPermissionAuditLog } from '@/api/service/permission-audit-log';

// ==============================
// 权限审计日志
// ==============================

export function useListPermissionAuditLogs(
  query: PaginationQuery,
  options?: UseQueryOptions<auditservicev1_ListPermissionAuditLogResponse, Error>,
) {
  return useQuery({
    queryKey: ['listPermissionAuditLogs', query],
    queryFn: () => listPermissionAuditLogs(query),
    ...options,
  });
}

export function useGetPermissionAuditLog(
  req: auditservicev1_GetPermissionAuditLogRequest,
  options?: UseQueryOptions<auditservicev1_PermissionAuditLog, Error>,
) {
  return useQuery({
    queryKey: ['getPermissionAuditLog', req],
    queryFn: () => getPermissionAuditLog(req),
    ...options,
  });
}
