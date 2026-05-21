import {makeOrderBy, makeQueryString, makeUpdateMask, type Paging, requestApi} from "@/core";
import {
    createDictEntryServiceClient,
    createDictTypeServiceClient, type pagination_PagingRequest
} from "@/api/generated/admin/service/v1";


const dictTypeService = createDictTypeServiceClient(requestApi);
const dictEntryService = createDictEntryServiceClient(requestApi);

function isTenantUser() {
    return false;
}

/**
 * 查询字典类型列表
 */
export async function listDictType(
    paging?: Paging,
    formValues?: null | Record<string, unknown>,
    fieldMask?: string,
    orderBy?: null | string[]
) {
    const noPaging = paging?.page === undefined && paging?.pageSize === undefined;

    // 构建分页请求对象
    const pagingRequest: pagination_PagingRequest = {
        fieldMask: fieldMask || undefined,
        orderBy: makeOrderBy(orderBy),
        query: makeQueryString(formValues, isTenantUser()),
        page: paging?.page,
        pageSize: paging?.pageSize,
        noPaging,
        sorting: undefined,
    };

    return await dictTypeService.List(pagingRequest);
}

/**
 * 查询字典项列表
 */
export async function listDictEntry(
    paging?: Paging,
    formValues?: null | Record<string, unknown>,
    fieldMask?: string,
    orderBy?: null | string[]
) {
    const noPaging = paging?.page === undefined && paging?.pageSize === undefined;

    // 构建分页请求对象
    const pagingRequest: pagination_PagingRequest = {
        fieldMask: fieldMask || undefined,
        orderBy: makeOrderBy(orderBy),
        query: makeQueryString(formValues, isTenantUser()),
        page: paging?.page,
        pageSize: paging?.pageSize,
        noPaging,
        sorting: undefined,
    };

    return await dictEntryService.List(pagingRequest);
}

/**
 * 获取字典类型
 */
export async function getDictType(id: number) {
    return await dictTypeService.Get({
        id,
    });
}

/**
 * 获取字典类型
 */
export async function getDictTypeByCode(code: string) {
    return await dictTypeService.Get({
        code,
    });
}

/**
 * 创建字典类型
 */
export async function createDictType(values: Record<string, any> = {}) {
    return await dictTypeService.Create({
        // @ts-ignore proto generated code is error.
        data: {
            ...values,
        },
    });
}

/**
 * 创建字典项
 */
export async function createDictEntry(values: Record<string, any> = {}) {
    return await dictEntryService.Create({
        // @ts-ignore proto generated code is error.
        data: {
            ...values,
        },
    });
}

/**
 * 更新字典类型
 */
export async function updateDictType(id: number, values: Record<string, any> = {}) {
    return await dictTypeService.Update({
        id,
        // @ts-ignore proto generated code is error.
        data: {
            ...values,
        },
        // @ts-ignore proto generated code is error.
        updateMask: makeUpdateMask(Object.keys(values ?? [])),
    });
}

/**
 * 更新字典项
 */
export async function updateDictEntry(id: number, values: Record<string, any> = {}) {
    return await dictEntryService.Update({
        id,
        // @ts-ignore proto generated code is error.
        data: {
            ...values,
        },
        // @ts-ignore proto generated code is error.
        updateMask: makeUpdateMask(Object.keys(values ?? [])),
    });
}

/**
 * 删除字典类型
 */
export async function deleteDictType(ids: number[]) {
    return await dictTypeService.Delete({ids});
}

/**
 * 删除字典项
 */
export async function deleteDictEntry(ids: number[]) {
    return await dictEntryService.Delete({ids});
}
