import {message} from 'antd';
import i18next from 'i18next';

import {
    authenticateResponseInterceptor,
    errorMessageResponseInterceptor
} from "./preset-interceptors";
import {RequestClient} from "./request-client";
import {type HttpResponse} from "./types";
import {defaultIdGenerator} from "./utils";

// 用于存储获取 token 的函数
let getTokenCallback: (() => string | null) | null = null;

/**
 * 设置获取 Token 的回调函数
 * 需要在应用初始化时调用，传入从 AccessModel 获取 token 的方法
 */
export function setGetTokenCallback(callback: () => string | null) {
    getTokenCallback = callback;
}

export function createRequestClient(baseURL: string) {
    const client = new RequestClient({
        baseURL,
    });

    // 格式化令牌
    function formatToken(token: null | string) {
        return token ? `Bearer ${token}` : null;
    }

    // 请求头处理
    client.addRequestInterceptor({
        fulfilled: (config) => {

            if (getTokenCallback) {
                const token = getTokenCallback();
                console.log('token', token);
                config.headers.Authorization = formatToken(token);
            }
            // if (getLocale) {
            //   config.headers['Accept-Language'] = getLocale();
            // }

            const requestId = config.headers["X-Request-ID"] || defaultIdGenerator();
            (config as any)._requestId = requestId;
            config.headers["X-Request-ID"] = requestId;
            config.headers["X-Requested-With"] = "XMLHttpRequest";

            return config as never;
        },
    });

    // response数据解构
    client.addResponseInterceptor({
        fulfilled: (response) => {
            const {data: responseData, status} = response;

            // TODO 根据Kratos进行定制

            if (status >= 200 && status < 400) {
                return responseData;
            }

            const {code} = responseData as HttpResponse;
            if (code !== null) {
                throw Object.assign({}, responseData, {responseData});
            }

            console.error('parse HttpResponse failed!', response);
            throw Object.assign({}, response, {response});
        },
    });

    // token 过期的处理
    client.addResponseInterceptor(
        authenticateResponseInterceptor({
            client,
            doReAuthenticate: async () => {
                console.warn('Token expired, need to re-authenticate');
            },
            doRefreshToken: async () => {
                // 这里需要从 AccessModel 获取 refresh_token
                // 实际使用时需要在应用初始化时设置
                return '';
            },
            enableRefreshToken: true,
            formatToken,
        }),
    );

    // 错误消息 i18n 映射（使用 common 命名空间下的 requestError）
    const errorKeyMap: Record<string, string> = {
        'network.error': 'common:requestError.networkError',
        'error.timeout': 'common:requestError.timeout',
        'error.badRequest': 'common:requestError.badRequest',
        'error.unauthorized': 'common:requestError.unauthorized',
        'error.forbidden': 'common:requestError.forbidden',
        'error.notFound': 'common:requestError.notFound',
        'error.requestTimeout': 'common:requestError.requestTimeout',
        'error.internalServerError': 'common:requestError.internalServerError',
    };

    // 通用的错误处理
    client.addResponseInterceptor(
        errorMessageResponseInterceptor((msg: string, error?: unknown) => {
            // 使用 i18n 映射表获取翻译后的错误消息
            const i18nKey = errorKeyMap[msg] || `common:requestError.${msg}`;
            const errorMessage = i18next.exists(i18nKey)
                ? i18next.t(i18nKey)
                : msg;
            // 使用 key 防止重复弹出相同类型的错误消息
            message.error({content: errorMessage, key: msg});
        }),
    );

    return client;
}


export const requestClient = createRequestClient(import.meta.env.VITE_API_URL);
