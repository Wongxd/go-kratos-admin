export interface Settings {
    colorPrimary: string;
    borderRadius: number;
    layout: 'side' | 'top' | 'mix';
    contentWidth: 'Fluid' | 'Fixed';
    fixedHeader: boolean;
    fixSiderbar: boolean;
}

export const defaultSettings: Settings = {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    layout: 'side',
    contentWidth: 'Fluid',
    fixedHeader: true,
    fixSiderbar: true,
};
