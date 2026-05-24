import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type identityservicev1_CreateOrgUnitRequest,
  type identityservicev1_DeleteOrgUnitRequest,
  type identityservicev1_GetOrgUnitRequest,
  type identityservicev1_ListOrgUnitResponse,
  type identityservicev1_OrgUnit,
  type identityservicev1_UpdateOrgUnitRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import {
  listOrgUnits,
  getOrgUnit,
  createOrgUnit,
  updateOrgUnit,
  deleteOrgUnit,
} from '@/api/service/org-unit';

// ==============================
// 组织架构管理
// ==============================

export function useListOrgUnits(
  query: PaginationQuery,
  options?: UseQueryOptions<identityservicev1_ListOrgUnitResponse, Error>,
) {
  return useQuery({
    queryKey: ['listOrgUnits', query],
    queryFn: () => listOrgUnits(query),
    ...options,
  });
}

export function useGetOrgUnit(
  req: identityservicev1_GetOrgUnitRequest,
  options?: UseQueryOptions<identityservicev1_OrgUnit, Error>,
) {
  return useQuery({
    queryKey: ['getOrgUnit', req],
    queryFn: () => getOrgUnit(req),
    ...options,
  });
}

export function useCreateOrgUnit(
  options?: UseMutationOptions<{}, Error, identityservicev1_CreateOrgUnitRequest>,
) {
  return useMutation({
    mutationFn: (data) => createOrgUnit(data),
    ...options,
  });
}

export function useUpdateOrgUnit(
  options?: UseMutationOptions<{}, Error, identityservicev1_UpdateOrgUnitRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateOrgUnit(data),
    ...options,
  });
}

export function useDeleteOrgUnit(
  options?: UseMutationOptions<{}, Error, identityservicev1_DeleteOrgUnitRequest>,
) {
  return useMutation({
    mutationFn: (req) => deleteOrgUnit(req),
    ...options,
  });
}
