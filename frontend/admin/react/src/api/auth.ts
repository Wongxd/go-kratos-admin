import {
    type authenticationservicev1_LoginRequest,
    createAuthenticationServiceClient
} from "@/api/generated/admin/service/v1";
import {requestApi} from "@/core";
import {encryptPassword} from "@/utils";

const authenticationServiceClient = createAuthenticationServiceClient(requestApi);

export async function login(request: authenticationservicev1_LoginRequest) {
    return authenticationServiceClient.Login(request);
}

export async function logout() {
    return authenticationServiceClient.Logout({});
}

export async function register(username: string, password: string, tenantCode: string = '') {
    return await authenticationServiceClient.RegisterUser({
        username,
        password: encryptPassword(password),
        tenantCode: tenantCode,
    });
}

export async function generateCaptcha() {
    return await authenticationServiceClient.GenerateCaptcha({});
}

export async function refreshToken(refreshToken: string) {
    return authenticationServiceClient.RefreshToken({
        grant_type: "refresh_token",
        refresh_token: refreshToken ?? "",
    });
}
