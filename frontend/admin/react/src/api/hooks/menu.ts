import {
  type resourceservicev1_CreateMenuRequest,
  type resourceservicev1_DeleteMenuRequest,
  type resourceservicev1_GetMenuRequest,
  type resourceservicev1_ListMenuResponse,
  type resourceservicev1_Menu,
  type resourceservicev1_UpdateMenuRequest,
} from '@/api/generated/admin/service/v1';
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { type PaginationQuery } from '@/core';
import { listMenus, getMenu, createMenu, updateMenu, deleteMenu } from '@/api/service/menu';

// ==============================
// 菜单管理
// ==============================

export function useListMenus(
  query: PaginationQuery,
  options?: UseQueryOptions<resourceservicev1_ListMenuResponse, Error>,
) {
  return useQuery({
    queryKey: ['listMenus', query],
    queryFn: () => listMenus(query),
    ...options,
  });
}

export function useGetMenu(
  req: resourceservicev1_GetMenuRequest,
  options?: UseQueryOptions<resourceservicev1_Menu, Error>,
) {
  return useQuery({
    queryKey: ['getMenu', req],
    queryFn: () => getMenu(req),
    ...options,
  });
}

export function useCreateMenu(
  options?: UseMutationOptions<{}, Error, resourceservicev1_CreateMenuRequest>,
) {
  return useMutation({
    mutationFn: (data) => createMenu(data),
    ...options,
  });
}

export function useUpdateMenu(
  options?: UseMutationOptions<{}, Error, resourceservicev1_UpdateMenuRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateMenu(data),
    ...options,
  });
}

export function useDeleteMenu(
  options?: UseMutationOptions<{}, Error, resourceservicev1_DeleteMenuRequest>,
) {
  return useMutation({
    mutationFn: (data) => deleteMenu(data),
    ...options,
  });
}
