import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import type { ConsultationMessage } from '../../types';

interface Props {
  messages: ConsultationMessage[];
  currentUserId: string;
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}

export function ChatPanel({
  messages,
  currentUserId,
  onSend,
  disabled,
  disabledReason,
}: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ConsultationMessage>>(null);

  const submit = async () => {
    if (!text.trim() || sending) {
      return;
    }
    setSending(true);
    try {
      await onSend(text);
      setText('');
    } catch (e) {
      Alert.alert('Message not sent', getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.flex}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No messages yet. Say hello.</Text>
        }
        renderItem={({ item }) => {
          const mine = item.senderId === currentUserId;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.body, mine && styles.mineText]}>
                {item.body}
              </Text>
              <Text style={[styles.time, mine && styles.mineText]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />
      {disabled ? (
        <Text style={styles.disabled}>
          {disabledReason ?? 'Chat is closed.'}
        </Text>
      ) : (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable
            onPress={submit}
            disabled={sending || !text.trim()}
            accessibilityRole="button"
            style={[
              styles.send,
              (sending || !text.trim()) && styles.sendDisabled,
            ]}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.md, flexGrow: 1 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { color: colors.text, fontSize: 15 },
  mineText: { color: colors.white },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  send: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 42,
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: colors.white, fontWeight: '600' },
  disabled: {
    textAlign: 'center',
    padding: spacing.md,
    color: colors.textMuted,
    backgroundColor: colors.surface,
  },
});
