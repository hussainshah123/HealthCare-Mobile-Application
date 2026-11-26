import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';

interface Props {
  title: string;
  type: 'AUDIO' | 'VIDEO';
  onEnd: () => void;
  endLabel?: string;
}

/**
 * Audio/video call UI shell.
 *
 * TODO(webrtc): integrate react-native-webrtc:
 *  1. getUserMedia({ audio: true, video: type === 'VIDEO' }) -> local stream, render with <RTCView>.
 *  2. Create RTCPeerConnection (STUN/TURN from backend config).
 *  3. Signal via consultationSocket.signal('webrtc:offer' | 'webrtc:answer' | 'webrtc:ice', consultationId, data)
 *     and consultationSocket.onSignal(...) (see src/socket/consultations.ts).
 *  4. Wire mute -> audioTrack.enabled, camera -> videoTrack.enabled, end -> pc.close().
 */
export function CallPlaceholder({
  title,
  type,
  onEnd,
  endLabel = 'End call',
}: Props) {
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === 'VIDEO');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.remote}>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.sub}>
          {type === 'VIDEO' ? 'Video' : 'Audio'} call · {mm}:{ss}
        </Text>
        <Text style={styles.note}>
          Live {type === 'VIDEO' ? 'video' : 'audio'} is not connected yet
          (WebRTC pending). Use the chat to continue the consultation.
        </Text>
      </View>
      {type === 'VIDEO' ? (
        <View style={styles.self}>
          <Text style={styles.selfText}>{cameraOn ? 'You' : 'Camera off'}</Text>
        </View>
      ) : null}
      <View style={styles.controls}>
        <Control
          label={muted ? 'Unmute' : 'Mute'}
          active={muted}
          onPress={() => setMuted(m => !m)}
        />
        {type === 'VIDEO' ? (
          <Control
            label={cameraOn ? 'Camera off' : 'Camera on'}
            active={!cameraOn}
            onPress={() => setCameraOn(c => !c)}
          />
        ) : null}
        <Control label={endLabel} danger onPress={onEnd} />
      </View>
    </SafeAreaView>
  );
}

function Control({
  label,
  onPress,
  active,
  danger,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.control,
        active && styles.controlActive,
        danger && styles.controlDanger,
      ]}
    >
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#11161C' },
  remote: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  name: { color: colors.white, fontSize: 24, fontWeight: '700' },
  sub: { color: '#B8C2CC', marginTop: spacing.sm },
  note: { color: '#8893A0', marginTop: spacing.xl, textAlign: 'center' },
  self: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 100,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: '#2A333D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfText: { color: colors.white, fontSize: 12 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: spacing.xl,
  },
  control: {
    minWidth: 90,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: '#2A333D',
    alignItems: 'center',
  },
  controlActive: { backgroundColor: '#4A5866' },
  controlDanger: { backgroundColor: colors.danger },
  controlText: { color: colors.white, fontWeight: '600' },
});
