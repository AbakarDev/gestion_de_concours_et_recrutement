import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationMessage,
  type AppNotification,
} from '../api/notifications';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await listNotifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader kicker="Alertes" title="Notifications" subtitle={unread ? `${unread} non lue(s)` : 'Toutes lues'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        {unread > 0 ? (
          <Pressable
            onPress={async () => {
              await markAllNotificationsRead();
              load();
            }}
            style={styles.markAll}
          >
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </Pressable>
        ) : null}
        {loading && items.length === 0 ? <ActivityIndicator color={colors.navy} /> : null}
        {items.length === 0 && !loading ? <Text style={styles.empty}>Aucune notification pour le moment.</Text> : null}
        {items.map((n) => (
          <Pressable
            key={n.id}
            style={[styles.row, !n.read_at && styles.unread]}
            onPress={async () => {
              if (!n.read_at) await markNotificationRead(n.id);
              load();
            }}
          >
            <Text style={styles.msg}>{notificationMessage(n)}</Text>
            <Text style={styles.date}>{new Date(n.created_at).toLocaleString('fr-FR')}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  markAll: { marginBottom: 12 },
  markAllText: { color: colors.navy, fontWeight: '700' },
  empty: { color: colors.muted },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  unread: { borderColor: '#93C5FD', backgroundColor: '#F8FBFF' },
  msg: { color: colors.text, fontWeight: '600', lineHeight: 20 },
  date: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
