import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadProfilesWithoutKeys } from '../core/security/keystore';

const FLAG = 'sml.persist', PROFILES = 'sml.profiles';
const persistEnabled = (): boolean => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };

interface Ctx {
  /** Nhớ endpoint/model API (không bao giờ có key) trên thiết bị này. */
  persist: boolean;
  setPersist: (on: boolean) => void;
}

const C = createContext<Ctx | null>(null);
export const useApp = (): Ctx => {
  const c = useContext(C);
  if (!c) throw new Error('Thiếu AppProvider');
  return c;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [persist, setPersistFlag] = useState<boolean>(persistEnabled);

  useEffect(() => {
    if (persist) loadProfilesWithoutKeys();
    // Phiên bản cũ lưu nháp bài làm trong IndexedDB; tính năng đã bỏ nên xóa dữ liệu cũ khỏi máy.
    try { indexedDB.deleteDatabase('simulation-ml'); } catch { /* không có IndexedDB */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setPersist = useCallback((on: boolean) => {
    try {
      localStorage.setItem(FLAG, on ? '1' : '0');
      if (!on) localStorage.removeItem(PROFILES);
    } catch { /* bộ nhớ bị chặn */ }
    setPersistFlag(on);
  }, []);

  return <C.Provider value={{ persist, setPersist }}>{children}</C.Provider>;
}
