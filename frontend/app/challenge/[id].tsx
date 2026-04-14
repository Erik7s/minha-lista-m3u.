import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, Challenge, DailyCheckIn } from '../../utils/api';
import { differenceInDays, format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChallengeDetailScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(true);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallengeData();
  }, [id]);

  const loadChallengeData = async () => {
    if (!id) return;
    try {
      const [challengeData, checkInsData, todayData] = await Promise.all([
        api.getChallenge(id as string),
        api.getCheckIns(id as string),
        api.getTodayCheckIn(id as string),
      ]);
      setChallenge(challengeData);
      setCheckIns(checkInsData);
      setTodayCheckIn(todayData);
    } catch (error) {
      console.error('Error loading challenge:', error);
      Alert.alert('Error', 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id) return;
    try {
      await api.createCheckIn(id as string, {
        completed: checkInCompleted,
        notes: checkInNotes || undefined,
      });
      setShowCheckInModal(false);
      setCheckInNotes('');
      loadChallengeData();
      Alert.alert(
        t.congratulations,
        checkInCompleted
          ? 'Great job keeping your commitment!'
          : 'Thank you for your honesty. Tomorrow is a new day.'
      );
    } catch (error: any) {
      console.error('Error creating check-in:', error);
      Alert.alert('Error', error.message || 'Failed to create check-in');
    }
  };

  if (loading || !challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const progressPercentage = (challenge.completed_checkins / challenge.duration_days) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {challenge.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Challenge Info */}
        <View style={styles.infoCard}>
          <View style={styles.lockHeader}>
            <Ionicons name="lock-closed" size={32} color="#6366f1" />
            <View style={styles.lockTextContainer}>
              <Text style={styles.lockText}>Locked Challenge</Text>
              <Text style={styles.lockSubtext}>No edits allowed</Text>
            </View>
          </View>

          <Text style={styles.description}>{challenge.description}</Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>{t.progress}</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]}
              />
            </View>
            <View style={styles.progressStats}>
              <View style={styles.stat}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.statText}>
                  {challenge.completed_checkins} {t.completedDays}
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
                <Text style={styles.statText}>
                  {challenge.total_checkins - challenge.completed_checkins} {t.missedDays}
                </Text>
              </View>
            </View>
          </View>

          {/* Reward */}
          <View style={styles.rewardSection}>
            <Text style={styles.sectionTitle}>{t.yourReward}</Text>
            <View style={styles.rewardBox}>
              <Ionicons name="gift" size={32} color="#10b981" />
              <Text style={styles.rewardText}>{challenge.reward}</Text>
            </View>
          </View>

          {/* Days Remaining */}
          <View style={styles.daysSection}>
            <Ionicons name="calendar" size={24} color="#6366f1" />
            <Text style={styles.daysText}>
              {daysLeft > 0
                ? `${daysLeft} ${daysLeft === 1 ? t.dayLeft : t.daysLeft}`
                : 'Challenge period ended'}
            </Text>
          </View>
        </View>

        {/* Check-in Button */}
        {daysLeft >= 0 && (
          <TouchableOpacity
            style={[
              styles.checkInButton,
              todayCheckIn && styles.checkInButtonDisabled,
            ]}
            onPress={() => setShowCheckInModal(true)}
            disabled={!!todayCheckIn}
          >
            <Ionicons
              name={todayCheckIn ? 'checkmark-done' : 'add-circle'}
              size={24}
              color="#fff"
            />
            <Text style={styles.checkInButtonText}>
              {todayCheckIn ? t.alreadyCheckedIn : t.checkInNow}
            </Text>
          </TouchableOpacity>
        )}

        {/* Check-in History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{t.dailyCheckIns}</Text>
          {checkIns.length === 0 ? (
            <Text style={styles.emptyText}>No check-ins yet. Start today!</Text>
          ) : (
            checkIns.map((checkIn) => (
              <View key={checkIn.id} style={styles.checkInItem}>
                <View style={styles.checkInLeft}>
                  <Ionicons
                    name={checkIn.completed ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={checkIn.completed ? '#10b981' : '#ef4444'}
                  />
                  <View style={styles.checkInInfo}>
                    <Text style={styles.checkInDate}>
                      {format(new Date(checkIn.date), 'MMM d, yyyy')}
                    </Text>
                    {checkIn.notes && (
                      <Text style={styles.checkInNotes}>{checkIn.notes}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Check-in Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.dailyCheckIn}</Text>
            <Text style={styles.modalQuestion}>{t.didYouComplete}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  checkInCompleted ? styles.modalButtonActive : styles.modalButtonInactive,
                ]}
                onPress={() => setCheckInCompleted(true)}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={checkInCompleted ? '#fff' : '#10b981'}
                />
                <Text
                  style={[
                    styles.modalButtonText,
                    checkInCompleted && styles.modalButtonTextActive,
                  ]}
                >
                  {t.yes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  !checkInCompleted ? styles.modalButtonActive : styles.modalButtonInactive,
                ]}
                onPress={() => setCheckInCompleted(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={32}
                  color={!checkInCompleted ? '#fff' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.modalButtonText,
                    !checkInCompleted && styles.modalButtonTextActive,
                  ]}
                >
                  {t.no}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder={t.optional}
              value={checkInNotes}
              onChangeText={setCheckInNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCheckInModal(false);
                  setCheckInNotes('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleCheckIn}>
                <Text style={styles.modalSubmitButtonText}>{t.submit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  lockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lockTextContainer: {
    marginLeft: 12,
  },
  lockText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  lockSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  rewardSection: {
    marginBottom: 24,
  },
  rewardBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  daysSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  daysText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginLeft: 12,
  },
  checkInButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  checkInButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkInInfo: {
    marginLeft: 12,
    flex: 1,
  },
  checkInDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  checkInNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalQuestion: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  modalButtonInactive: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  modalButtonTextActive: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
