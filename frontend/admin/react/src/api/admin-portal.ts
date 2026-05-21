import {requestApi} from "@/core";
import {createAdminPortalServiceClient} from "@/api/generated/admin/service/v1";

const adminPortalServiceClient = createAdminPortalServiceClient(requestApi);

export async function listRouter() {
    return await adminPortalServiceClient.GetNavigation({});
}
