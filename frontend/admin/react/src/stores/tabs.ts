import { create } from 'zustand';

export interface TabItem {
  key: string;
  path: string;
  title: string;
  icon?: string;
  closable: boolean;
  pinned?: boolean;
}

interface TabsState {
  // 所有标签页列表
  tabs: TabItem[];
  
  // 添加标签页
  addTab: (tab: Omit<TabItem, 'closable'> & { closable?: boolean }) => void;
  
  // 移除标签页
  removeTab: (key: string) => void;
  
  // 关闭标签页
  closeTab: (key: string) => void;
  
  // 关闭左侧标签页
  closeLeftTabs: (key: string) => void;
  
  // 关闭右侧标签页
  closeRightTabs: (key: string) => void;
  
  // 关闭其他标签页
  closeOtherTabs: (key: string) => void;
  
  // 关闭全部标签页
  closeAllTabs: () => void;
  
  // 固定/取消固定标签页
  togglePinTab: (key: string) => void;
  
  // 重新加载标签页
  reloadTab: (key: string) => void;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  
  addTab: (tab) => {
    set((state) => {
      // 检查是否已存在
      const exists = state.tabs.find((t) => t.key === tab.key);
      if (exists) {
        return state;
      }
      
      return {
        tabs: [
          ...state.tabs,
          {
            ...tab,
            closable: tab.closable !== false && tab.path !== '/',
          },
        ],
      };
    });
  },
  
  removeTab: (key) => {
    set((state) => ({
      tabs: state.tabs.filter((tab) => tab.key !== key),
    }));
  },
  
  closeTab: (key) => {
    const { tabs } = get();
    const currentIndex = tabs.findIndex((tab) => tab.key === key);
    
    if (currentIndex === -1) return;
    
    const currentTab = tabs[currentIndex];
    if (!currentTab.closable) return;
    
    // 如果关闭的是当前激活的标签，需要跳转到其他标签
    const newTabs = tabs.filter((tab) => tab.key !== key);
    
    set({ tabs: newTabs });
  },
  
  closeLeftTabs: (key) => {
    const { tabs } = get();
    const currentIndex = tabs.findIndex((tab) => tab.key === key);
    
    if (currentIndex === -1) return;
    
    // 保留当前标签及其右侧的标签，以及固定的标签
    const newTabs = tabs.filter((tab, index) => 
      index >= currentIndex || tab.pinned
    );
    
    set({ tabs: newTabs });
  },
  
  closeRightTabs: (key) => {
    const { tabs } = get();
    const currentIndex = tabs.findIndex((tab) => tab.key === key);
    
    if (currentIndex === -1) return;
    
    // 保留当前标签及其左侧的标签，以及固定的标签
    const newTabs = tabs.filter((tab, index) => 
      index <= currentIndex || tab.pinned
    );
    
    set({ tabs: newTabs });
  },
  
  closeOtherTabs: (key) => {
    const { tabs } = get();
    
    // 只保留当前标签和固定的标签
    const newTabs = tabs.filter((tab) => 
      tab.key === key || tab.pinned
    );
    
    set({ tabs: newTabs });
  },
  
  closeAllTabs: () => {
    const { tabs } = get();
    
    // 只保留固定的标签
    const newTabs = tabs.filter((tab) => tab.pinned);
    
    set({ tabs: newTabs });
  },
  
  togglePinTab: (key) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.key === key ? { ...tab, pinned: !tab.pinned } : tab
      ),
    }));
  },
  
  reloadTab: (key) => {
    // 这个功能需要配合 PageContainer 的刷新机制
    // 这里只是标记需要刷新，实际刷新由 PageContainer 处理
    console.log('[TabsStore] Reload tab:', key);
  },
}));
