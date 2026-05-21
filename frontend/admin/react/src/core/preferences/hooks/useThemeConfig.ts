import {useMemo} from 'react';
import {theme as antdTheme} from 'antd';

import {usePreferencesStore} from '../store';

export const useThemeConfig = () => {
    const {theme, app} = usePreferencesStore((state) => state.preferences);

    return useMemo(() => {
        const algorithms = [];
        if (theme.mode === 'dark') algorithms.push(antdTheme.darkAlgorithm);
        if (app.compact) algorithms.push(antdTheme.compactAlgorithm);

        return {
            algorithm: algorithms.length > 0 ? algorithms : antdTheme.defaultAlgorithm,
            token: {
                colorPrimary: theme.colorPrimary,
                colorSuccess: theme.colorSuccess,
                colorWarning: theme.colorWarning,
                colorError: theme.colorDestructive,
                borderRadius: Number.parseInt(theme.radius) || 6,
            },
            cssVar: true,
        };
    }, [theme, app]);
};
