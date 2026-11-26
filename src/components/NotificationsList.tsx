import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { notificationsApi } from '../api/notifications';
import { notificationSocket } from '../socket/notifications';
import { colors, spacing, typography } from '../theme';
import { getErrorMessage } from '../utils/errors';
import { formatDateTime } from '../utils/format';
import { useAsync } from '../utils/useAsync';
import type { AppNotification } from '../types';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState, ErrorState } from './EmptyState';
import { Loader } from './Loader';

const isRead = (n: AppNotification) => !!(n.read || n.readAt);

/** Notification inbox shared by all roles (GET /notifications + live /notifications socket). */
export function NotificationsList() {
  const list = useAsync(() => notificationsApi.list({ page: 1, limit: 50 }));

  useEffect(
    () =>
      notificationSocket.onNotification(n =>
        list.setData(prev =>
          prev
            ? {
                ...prev,
                items: [n, ...prev.items.filter(x => x.id !== n.id)],
                total: prev.total + 1,
              }
            : prev,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      list.setData(prev =>
        prev
          ? { ...prev, items: prev.items.map(n => ({ ...n, read: true })) }
          : prev,
      );
    } catch (e) {
      Alert.alert('Notifications', getErrorMessage(e));
    }
  };

  const open = async (n: AppNotification) => {
    if (isRead(n)) {
      return;
    }
    list.setData(prev =>
      prev
        ? {
            ...prev,
            items: prev.items.map(x =>
              x.id === n.id ? { ...x, read: true } : x,
            ),
          }
        : prev,
    );
    notificationsApi.markRead(n.id).catch(() => undefined);
  };

  if (list.loading && !list.data) {
    return <Loader />;
  }
  if (list.error && !list.data) {
    return <ErrorState message={list.error} onRetry={list.reload} />;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={list.data?.items ?? []}
      keyExtractor={n => n.id}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      ListHeaderComponent={
        list.data?.items.some(n => !isRead(n)) ? (
          <Button
            title="Mark all as read"
            small
            variant="ghost"
            onPress={markAll}
            style={styles.markAll}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState title="No notifications" message="You're all caught up." />
      }
      renderItem={({ item }) => (
        <Card
          onPress={() => open(item)}
          style={!isRead(item) ? styles.unread : undefined}
        >
          <View style={styles.row}>
            {!isRead(item) ? <View style={styles.dot} /> : null}
            <Text style={[typography.h3, styles.flex]}>{item.title}</Text>
          </View>
          <Text style={typography.body}>{item.body}</Text>
          {item.createdAt ? (
            <Text style={typography.small}>
              {formatDateTime(item.createdAt)}
            </Text>
          ) : null}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  markAll: { alignSelf: 'flex-end' },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  unread: { borderColor: colors.primary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
});
