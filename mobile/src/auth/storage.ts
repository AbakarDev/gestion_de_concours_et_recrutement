import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN = 'auth_token';
const REFRESH = 'refresh_token';
const USER = 'auth_user';

export type StoredUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles?: string[];
};

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH);
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function persistSession(access: string, refresh: string | null, user: StoredUser): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN, access],
    [USER, JSON.stringify(user)],
    ...(refresh ? [[REFRESH, refresh] as [string, string]] : []),
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN, REFRESH, USER]);
}
