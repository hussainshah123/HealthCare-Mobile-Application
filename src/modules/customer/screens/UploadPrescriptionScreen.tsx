import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import {
  ALLOWED_PRESCRIPTION_TYPES,
  MAX_PRESCRIPTION_BYTES,
  prescriptionsApi,
  type UploadFile,
} from '../../../api/prescriptions';
import { Button, Card, Input, Screen } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { CustomerScreenProps } from '../navigation/types';

export function UploadPrescriptionScreen({
  navigation,
}: CustomerScreenProps<'UploadPrescription'>) {
  const [file, setFile] = useState<
    (UploadFile & { size: number | null }) | null
  >(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const choose = async () => {
    try {
      const [res] = await pick({
        type: [types.images, types.pdf],
        mode: 'import',
      });
      const type = (res.type ?? '').toLowerCase();
      if (!ALLOWED_PRESCRIPTION_TYPES.includes(type)) {
        Alert.alert(
          'Unsupported file',
          'Please choose a JPG, PNG or PDF file.',
        );
        return;
      }
      if (res.size && res.size > MAX_PRESCRIPTION_BYTES) {
        Alert.alert('File too large', 'The file must be 10 MB or smaller.');
        return;
      }
      setFile({
        uri: res.uri,
        name:
          res.name ??
          `prescription.${type === 'application/pdf' ? 'pdf' : 'jpg'}`,
        type,
        size: res.size,
      });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Could not open file', getErrorMessage(e));
    }
  };

  const upload = async () => {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      await prescriptionsApi.upload(
        { uri: file.uri, name: file.name, type: file.type },
        notes.trim() || undefined,
      );
      Alert.alert(
        'Uploaded',
        'Your prescription was uploaded. A pharmacist will review it with your order.',
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert('Upload failed', getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <Screen
      footer={
        <Button
          title="Upload"
          onPress={upload}
          disabled={!file}
          loading={uploading}
        />
      }
    >
      <Text style={typography.body}>
        Upload a clear photo or PDF of your prescription (JPG, PNG or PDF, max
        10 MB). The pharmacy reviews it before dispatching prescription-only
        medicines.
      </Text>
      <Card onPress={choose} style={styles.picker}>
        {file ? (
          <>
            {isImage ? (
              <Image
                source={{ uri: file.uri }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.preview, styles.pdf]}>
                <Text style={styles.pdfText}>PDF</Text>
              </View>
            )}
            <Text style={typography.h3} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={typography.caption}>
              {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ` : ''}
              Tap to change
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.plus}>+</Text>
            <Text style={typography.h3}>Choose file</Text>
            <Text style={typography.caption}>Photo or PDF</Text>
          </>
        )}
      </Card>
      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Anything the pharmacist should know"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  picker: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  plus: { fontSize: 40, color: colors.primary },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  pdf: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: { fontSize: 32, fontWeight: '800', color: colors.primary },
});
