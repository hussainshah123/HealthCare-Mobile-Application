import React, { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, ErrorState, Loader } from '../../../components';
import { ChatPanel } from '../../../components/consultation/ChatPanel';
import { useConsultationChat } from '../../../components/consultation/useConsultationChat';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing } from '../../../theme';
import type { CustomerScreenProps } from '../navigation/types';

export function ConsultationScreen({
  route,
  navigation,
}: CustomerScreenProps<'Consultation'>) {
  const { consultationId, title, type } = route.params;
  const { user } = useAuth();
  const chat = useConsultationChat(consultationId);
  const callType = type === 'AUDIO' || type === 'VIDEO' ? type : null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight:
        callType && !chat.ended
          ? () => (
              <Button
                title={callType === 'VIDEO' ? 'Video call' : 'Call'}
                small
                variant="header"
                onPress={() =>
                  navigation.navigate('Call', {
                    consultationId,
                    title,
                    type: callType,
                  })
                }
              />
            )
          : undefined,
    });
  }, [navigation, callType, chat.ended, consultationId, title]);

  if (chat.loading) {
    return <Loader />;
  }
  if (chat.error) {
    return <ErrorState message={chat.error} onRetry={chat.reload} />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.banner}>
        {chat.ended ? (
          <>
            <Banner
              tone="success"
              title="Consultation ended"
              message="Any prescription from your doctor appears under My prescriptions."
            />
            <Button
              title="My prescriptions"
              small
              variant="outline"
              onPress={() => navigation.navigate('MyPrescriptions')}
            />
          </>
        ) : chat.consultation?.status === 'WAITING' ? (
          <Banner
            tone="info"
            title="Waiting for the doctor"
            message="You can send messages while you wait."
          />
        ) : !chat.connected ? (
          <Banner
            tone="warning"
            title="Reconnecting…"
            message="Messages will be sent over HTTP meanwhile."
          />
        ) : null}
      </View>
      <ChatPanel
        messages={chat.messages}
        currentUserId={user?.id ?? ''}
        onSend={chat.send}
        disabled={chat.ended}
        disabledReason="This consultation has ended."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  banner: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
