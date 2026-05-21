import {requestApi} from "@/core";
import {
    createUserServiceClient,
    type identityservicev1_User,
    type pagination_PagingRequest
} from "@/api/generated/admin/service/v1";
import {makeOrderBy, makeQueryString, type Paging} from "@/core/transport/rest";

const userServiceClient = createUserServiceClient(requestApi);

function isTenantUser() {
    return false;
}

export async function listUsers(
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

    return await userServiceClient.List(pagingRequest);
}

export async function getUser(id: number) {
    return await userServiceClient.Get({id});
}

export async function createUser(data: identityservicev1_User, password?: string) {
    return await userServiceClient.Create({
        data,
        password,
    });
}

export async function deleteUser(id: number) {
    return await userServiceClient.Delete({id});
}
