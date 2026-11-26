import React, { useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationsApi } from '../../../api/consultations';
import { Banner, Button, ErrorState, Loader } from '../../../components';
import { ChatPanel } from '../../../components/consultation/ChatPanel';
import { useConsultationChat } from '../../../components/consultation/useConsultationChat';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { DoctorScreenProps } from '../navigation/types';

export function ConsultationScreen({
  route,
  navigation,
}: DoctorScreenProps<'Consultation'>) {
  const { consultationId, patientName, type } = route.params;
  const { user } = useAuth();
  const chat = useConsultationChat(consultationId);
  const [ending, setEnding] = useState(false);
  const callType = type === 'AUDIO' || type === 'VIDEO' ? type : null;

  const end = () =>
    Alert.alert(
      'End consultation?',
      'The patient will no longer be able to send messages.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            try {
              const c = await consultationsApi.end(consultationId);
              chat.setConsultation(c);
              chat.setEnded(true);
            } catch (e) {
              Alert.alert('Could not end consultation', getErrorMessage(e));
            } finally {
              setEnding(false);
            }
          },
        },
      ],
    );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: chat.ended
        ? undefined
        : () => (
            <View style={styles.headerActions}>
              {callType ? (
                <Button
                  title="Call"
                  small
                  variant="header"
                  onPress={() =>
                    navigation.navigate('Call', {
                      consultationId,
                      title: patientName,
                      type: callType,
                    })
                  }
                />
              ) : null}
              <Button
                title="End"
                small
                variant="header"
                loading={ending}
                onPress={end}
              />
            </View>
          ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, chat.ended, callType, ending]);

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
              message="Write a prescription for the patient."
            />
            <Button
              title="Write prescription"
              small
              onPress={() =>
                navigation.navigate('WritePrescription', {
                  consultationId,
                  patientName,
                })
              }
            />
          </>
        ) : !chat.connected ? (
          <Banner tone="warning" title="Reconnecting…" />
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
  headerActions: { flexDirection: 'row' },
});
