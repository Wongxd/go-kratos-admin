import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type identityservicev1_CreatePositionRequest,
  type identityservicev1_DeletePositionRequest,
  type identityservicev1_GetPositionRequest,
  type identityservicev1_ListPositionResponse,
  type identityservicev1_Position,
  type identityservicev1_UpdatePositionRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from '@/api/service/position';

// ==============================
// 职位管理
// ==============================

export function useListPositions(
  query: PaginationQuery,
  options?: UseQueryOptions<identityservicev1_ListPositionResponse, Error>,
) {
  return useQuery({
    queryKey: ['listPositions', query],
    queryFn: () => listPositions(query),
    ...options,
  });
}

export function useGetPosition(
  req: identityservicev1_GetPositionRequest,
  options?: UseQueryOptions<identityservicev1_Position, Error>,
) {
  return useQuery({
    queryKey: ['getPosition', req],
    queryFn: () => getPosition(req),
    ...options,
  });
}

export function useCreatePosition(
  options?: UseMutationOptions<{}, Error, identityservicev1_CreatePositionRequest>,
) {
  return useMutation({
    mutationFn: (data) => createPosition(data),
    ...options,
  });
}

export function useUpdatePosition(
  options?: UseMutationOptions<{}, Error, identityservicev1_UpdatePositionRequest>,
) {
  return useMutation({
    mutationFn: (data) => updatePosition(data),
    ...options,
  });
}

export function useDeletePosition(
  options?: UseMutationOptions<{}, Error, identityservicev1_DeletePositionRequest>,
) {
  return useMutation({
    mutationFn: (req) => deletePosition(req),
    ...options,
  });
}
