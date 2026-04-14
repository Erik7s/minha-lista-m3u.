import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [duration, setDuration] = useState('15');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a challenge title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!reward.trim()) {
      Alert.alert('Error', 'Please enter a reward');
      return;
    }
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    setShowPreview(true);
  };

  const handleLock = async () => {
    setLoading(true);
    try {
      const challenge = await api.createChallenge({
        title,
        description,
        reward,
        duration_days: parseInt(duration),
        language,
      });

      // Lock the challenge immediately
      await api.lockChallenge(challenge.id);

      Alert.alert(
        t.congratulations,
        'Your challenge is now locked. Your journey begins!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPreview(false);
              setTitle('');
              setDescription('');
              setReward('');
              setDuration('15');
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.createChallenge}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.challengeTitle}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.challengeTitlePlaceholder}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.description}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.reward}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.rewardPlaceholder}
                value={reward}
                onChangeText={setReward}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.duration}</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={handleCreate}
              disabled={loading}
            >
              <Ionicons name="eye" size={24} color="#fff" />
              <Text style={styles.previewButtonText}>{t.previewChallenge}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.previewChallenge}</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={48} color="#f59e0b" />
              <Text style={styles.warningTitle}>{t.lockWarningTitle}</Text>
              <Text style={styles.warningMessage}>{t.lockWarningMessage}</Text>
            </View>

            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="trophy" size={32} color="#6366f1" />
                <Text style={styles.previewTitle}>{title}</Text>
              </View>
              <Text style={styles.previewDescription}>{description}</Text>

              <View style={styles.previewDivider} />

              <View style={styles.previewReward}>
                <Ionicons name="gift" size={24} color="#10b981" />
                <View style={styles.previewRewardContent}>
                  <Text style={styles.previewRewardLabel}>{t.yourReward}</Text>
                  <Text style={styles.previewRewardText}>{reward}</Text>
                </View>
              </View>

              <View style={styles.previewDivider} />

              <View style={styles.previewDuration}>
                <Ionicons name="calendar" size={24} color="#6366f1" />
                <Text style={styles.previewDurationText}>
                  {duration} {t.daysLeft}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lockButton}
              onPress={handleLock}
              disabled={loading}
            >
              <Ionicons name="lock-closed" size={20} color="#fff" />
              <Text style={styles.lockButtonText}>{t.yesLockIt}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  previewButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 16,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 24,
  },
  previewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  previewReward: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewRewardContent: {
    marginLeft: 12,
    flex: 1,
  },
  previewRewardLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  previewRewardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  previewDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDurationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  lockButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  lockButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});
