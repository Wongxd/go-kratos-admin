import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type resourceservicev1_Api,
  type resourceservicev1_CreateApiRequest,
  type resourceservicev1_DeleteApiRequest,
  type resourceservicev1_GetApiRequest,
  type resourceservicev1_ListApiResponse,
  type resourceservicev1_UpdateApiRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import { listApis, getApi, createApi, updateApi, deleteApi } from '@/api/service/api';

// ==============================
// API 管理
// ==============================

export function useListApis(
  query: PaginationQuery,
  options?: UseQueryOptions<resourceservicev1_ListApiResponse, Error>,
) {
  return useQuery({
    queryKey: ['listApis', query],
    queryFn: () => listApis(query),
    ...options,
  });
}

export function useGetApi(
  req: resourceservicev1_GetApiRequest,
  options?: UseQueryOptions<resourceservicev1_Api, Error>,
) {
  return useQuery({
    queryKey: ['getApi', req],
    queryFn: () => getApi(req),
    ...options,
  });
}

export function useCreateApi(
  options?: UseMutationOptions<{}, Error, resourceservicev1_CreateApiRequest>,
) {
  return useMutation({
    mutationFn: (data) => createApi(data),
    ...options,
  });
}

export function useUpdateApi(
  options?: UseMutationOptions<{}, Error, resourceservicev1_UpdateApiRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateApi(data),
    ...options,
  });
}

export function useDeleteApi(
  options?: UseMutationOptions<{}, Error, resourceservicev1_DeleteApiRequest>,
) {
  return useMutation({
    mutationFn: (data) => deleteApi(data),
    ...options,
  });
}
