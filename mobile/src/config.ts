import { Platform } from 'react-native';

/**
 * Même API Laravel que le client web (`/api`, pas `/api/v1` dans ce dépôt).
 * Android émulateur : 10.0.2.2 pointe vers l’hôte. Appareil physique : IP LAN dans .env.
 */
export function apiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8001/api';
  }
  return 'http://127.0.0.1:8001/api';
}

export { NAVY, colors } from './theme';
