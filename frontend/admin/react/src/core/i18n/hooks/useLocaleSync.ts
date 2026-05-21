import {useEffect} from 'react';

import {useI18n} from './useI18n';
import {usePreferencesStore} from "@/core/preferences";
import type {SupportedLocale} from "@/locales";

export const useLocaleSync = () => {
    const {i18n} = useI18n();
    const {locale, setPreferences} = usePreferencesStore((state) => ({
        locale: state.preferences.app.locale,
        setPreferences: state.setPreferences,
    }));

    // preferences 变更 → 切换 i18n 语言
    useEffect(() => {
        if (locale && i18n.language !== locale) {
            i18n.changeLanguage(locale);
        }
    }, [locale, i18n]);

    // i18n 初始化后，反向同步到 store
    useEffect(() => {
        if (i18n.isInitialized && !locale) {
            const detected = i18n.language as SupportedLocale;
            setPreferences({app: {locale: detected}});
        }
    }, [i18n.isInitialized, i18n.language, locale, setPreferences]);

    // 便捷切换方法
    const changeLocale = async (newLocale: SupportedLocale) => {
        setPreferences({app: {locale: newLocale}});
    };

    return {changeLocale};
};
