import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type permissionservicev1_CreateRoleRequest,
  type permissionservicev1_DeleteRoleRequest,
  type permissionservicev1_GetRoleRequest,
  type permissionservicev1_ListRoleResponse,
  type permissionservicev1_Role,
  type permissionservicev1_UpdateRoleRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import { listRoles, getRole, createRole, updateRole, deleteRole } from '@/api/service/role';

// ==============================
// 角色管理
// ==============================

export function useListRoles(
  query: PaginationQuery,
  options?: UseQueryOptions<permissionservicev1_ListRoleResponse, Error>,
) {
  return useQuery({
    queryKey: ['listRoles', query],
    queryFn: () => listRoles(query),
    ...options,
  });
}

export function useGetRole(
  req: permissionservicev1_GetRoleRequest,
  options?: UseQueryOptions<permissionservicev1_Role, Error>,
) {
  return useQuery({
    queryKey: ['getRole', req],
    queryFn: () => getRole(req),
    ...options,
  });
}

export function useCreateRole(
  options?: UseMutationOptions<{}, Error, permissionservicev1_CreateRoleRequest>,
) {
  return useMutation({
    mutationFn: (data) => createRole(data),
    ...options,
  });
}

export function useUpdateRole(
  options?: UseMutationOptions<{}, Error, permissionservicev1_UpdateRoleRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateRole(data),
    ...options,
  });
}

export function useDeleteRole(
  options?: UseMutationOptions<{}, Error, permissionservicev1_DeleteRoleRequest>,
) {
  return useMutation({
    mutationFn: (req) => deleteRole(req),
    ...options,
  });
}
