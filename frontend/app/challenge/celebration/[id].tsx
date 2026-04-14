import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { api, Challenge } from '../../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CelebrationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    if (!id) return;
    try {
      const data = await api.getChallenge(id as string);
      setChallenge(data);
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!challenge) return;
    try {
      const message = t.shareMessage
        .replace('{challenge}', challenge.title)
        .replace('{reward}', challenge.reward);

      await Share.share({
        message,
        title: 'Ethos - Challenge Completed!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Header */}
        <View style={styles.celebrationHeader}>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={80} color="#f59e0b" />
          </View>
          <Text style={styles.congratsText} testID="celebration-congrats">
            {t.congratulations}
          </Text>
          <Text style={styles.celebrationMessage}>
            {t.celebrationMessage}
          </Text>
        </View>

        {/* Challenge Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.challengeTitle} testID="celebration-challenge-title">
            {challenge.title}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{challenge.completed_checkins}</Text>
              <Text style={styles.statLabel}>{t.completedDays}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{challenge.duration_days}</Text>
              <Text style={styles.statLabel}>{t.duration}</Text>
            </View>
          </View>

          <View style={styles.rewardBox}>
            <Ionicons name="gift" size={28} color="#10b981" />
            <View style={styles.rewardContent}>
              <Text style={styles.rewardLabel}>{t.yourReward}</Text>
              <Text style={styles.rewardText} testID="celebration-reward">
                {challenge.reward}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            testID="celebration-share-btn"
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>{t.shareSuccess}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="celebration-home-btn"
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="home" size={24} color="#6366f1" />
            <Text style={styles.homeButtonText}>{t.backToHome}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefce8',
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trophyContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  congratsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  challengeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  rewardContent: {
    marginLeft: 12,
    flex: 1,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  buttonContainer: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  homeButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  homeButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
