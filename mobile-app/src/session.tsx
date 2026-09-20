import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { mobileLogout, mobileRefresh, setAccessToken } from './api';
import type { MobileAuth } from './domain';

const REFRESH_KEY = 'health-companion.mobile.refresh.v1';
type SessionContextValue = { ready: boolean; signedIn: boolean; completeAuth: (auth: MobileAuth) => Promise<void>; unlock: () => Promise<boolean>; signOut: () => Promise<void> };
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

async function saveRefresh(refreshToken: string) {
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken, { requireAuthentication: true, authenticationPrompt: 'Unlock Health Companion' });
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false); const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { void unlock().finally(() => setReady(true)); }, []);
  async function completeAuth(auth: MobileAuth) { await saveRefresh(auth.session.refreshToken); setAccessToken(auth.session.accessToken); setSignedIn(true); }
  async function unlock() {
    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY, { requireAuthentication: true, authenticationPrompt: 'Unlock Health Companion' });
      if (!refresh) return false;
      const session = await mobileRefresh(refresh); await saveRefresh(session.refreshToken); setAccessToken(session.accessToken); setSignedIn(true); return true;
    } catch { setAccessToken(); setSignedIn(false); return false; }
  }
  async function signOut() {
    setAccessToken(); setSignedIn(false);
    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY, { requireAuthentication: true });
      if (refresh) await mobileLogout(refresh);
    } catch { /* cancelling authentication or a remote failure must not restore the session */ }
    finally {
      try { await SecureStore.deleteItemAsync(REFRESH_KEY); } catch { /* state is already signed out */ }
    }
  }
  return <SessionContext.Provider value={{ ready, signedIn, completeAuth, unlock, signOut }}>{children}</SessionContext.Provider>;
}
export function useSession() { const value = useContext(SessionContext); if (!value) throw new Error('SessionProvider is required'); return value; }
