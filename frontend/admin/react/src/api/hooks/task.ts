import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  type taskservicev1_CreateTaskRequest,
  type taskservicev1_DeleteTaskRequest,
  type taskservicev1_GetTaskRequest,
  type taskservicev1_ListTaskResponse,
  type taskservicev1_Task,
  type taskservicev1_UpdateTaskRequest,
} from '@/api/generated/admin/service/v1';
import { type PaginationQuery } from '@/core';
import { listTasks, getTask, createTask, updateTask, deleteTask } from '@/api/service/task';

// ==============================
// 任务管理
// ==============================

export function useListTasks(
  query: PaginationQuery,
  options?: UseQueryOptions<taskservicev1_ListTaskResponse, Error>,
) {
  return useQuery({
    queryKey: ['listTasks', query],
    queryFn: () => listTasks(query),
    ...options,
  });
}

export function useGetTask(
  req: taskservicev1_GetTaskRequest,
  options?: UseQueryOptions<taskservicev1_Task, Error>,
) {
  return useQuery({
    queryKey: ['getTask', req],
    queryFn: () => getTask(req),
    ...options,
  });
}

export function useCreateTask(
  options?: UseMutationOptions<{}, Error, taskservicev1_CreateTaskRequest>,
) {
  return useMutation({
    mutationFn: (data) => createTask(data),
    ...options,
  });
}

export function useUpdateTask(
  options?: UseMutationOptions<{}, Error, taskservicev1_UpdateTaskRequest>,
) {
  return useMutation({
    mutationFn: (data) => updateTask(data),
    ...options,
  });
}

export function useDeleteTask(
  options?: UseMutationOptions<{}, Error, taskservicev1_DeleteTaskRequest>,
) {
  return useMutation({
    mutationFn: (req) => deleteTask(req),
    ...options,
  });
}
