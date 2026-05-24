import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type permissionservicev1_CreatePermissionGroupRequest,
  type permissionservicev1_DeletePermissionGroupRequest,
  type permissionservicev1_GetPermissionGroupRequest,
  type permissionservicev1_ListPermissionGroupResponse,
  type permissionservicev1_PermissionGroup,
  type permissionservicev1_UpdatePermissionGroupRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import {
  listPermissionGroups,
  getPermissionGroup,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
} from '@/api/service/permission-group';

// ==============================
// 权限组管理
// ==============================

export function useListPermissionGroups(
  query: PaginationQuery,
  options?: UseQueryOptions<permissionservicev1_ListPermissionGroupResponse, Error>,
) {
  return useQuery({
    queryKey: ['listPermissionGroups', query],
    queryFn: () => listPermissionGroups(query),
    ...options,
  });
}

export function useGetPermissionGroup(
  req: permissionservicev1_GetPermissionGroupRequest,
  options?: UseQueryOptions<permissionservicev1_PermissionGroup, Error>,
) {
  return useQuery({
    queryKey: ['getPermissionGroup', req],
    queryFn: () => getPermissionGroup(req),
    ...options,
  });
}

export function useCreatePermissionGroup(
  options?: UseMutationOptions<{}, Error, permissionservicev1_CreatePermissionGroupRequest>,
) {
  return useMutation({
    mutationFn: (data) => createPermissionGroup(data),
    ...options,
  });
}

export function useUpdatePermissionGroup(
  options?: UseMutationOptions<{}, Error, permissionservicev1_UpdatePermissionGroupRequest>,
) {
  return useMutation({
    mutationFn: (data) => updatePermissionGroup(data),
    ...options,
  });
}

export function useDeletePermissionGroup(
  options?: UseMutationOptions<{}, Error, permissionservicev1_DeletePermissionGroupRequest>,
) {
  return useMutation({
    mutationFn: (req) => deletePermissionGroup(req),
    ...options,
  });
}
