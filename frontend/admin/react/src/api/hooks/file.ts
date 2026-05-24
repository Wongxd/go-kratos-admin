import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type storageservicev1_CreateFileRequest,
  type storageservicev1_UpdateFileRequest,
  type storageservicev1_DeleteFileRequest,
  type storageservicev1_File,
  type storageservicev1_GetFileRequest,
  type storageservicev1_ListFileResponse,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core/transport/rest';
import { listFiles, getFile, createFile, updateFile, deleteFile } from '@/api/service/file';

// ==============================
// 文件管理
// ==============================

export function useListFiles(
  query: PaginationQuery,
  options?: UseQueryOptions<storageservicev1_ListFileResponse, Error>,
) {
  return useQuery({
    queryKey: ['listFiles', query],
    queryFn: () => listFiles(query),
    ...options,
  });
}

export function useGetFile(
  req: storageservicev1_GetFileRequest,
  options?: UseQueryOptions<storageservicev1_File, Error>,
) {
  return useQuery({
    queryKey: ['getFile', req],
    queryFn: () => getFile(req),
    ...options,
  });
}

export function useCreateFile(
  options?: UseMutationOptions<{}, Error, storageservicev1_CreateFileRequest>,
) {
  return useMutation({
    mutationFn: (data) => createFile(data),
    ...options,
  });
}

export function useUpdateFile(
  options?: UseMutationOptions<{}, Error, storageservicev1_UpdateFileRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateFile(data),
    ...options,
  });
}

export function useDeleteFile(
  options?: UseMutationOptions<{}, Error, storageservicev1_DeleteFileRequest>,
) {
  return useMutation({
    mutationFn: (data) => deleteFile(data),
    ...options,
  });
}
