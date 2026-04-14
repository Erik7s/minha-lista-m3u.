import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, Challenge } from '../../utils/api';
import { differenceInDays, format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await api.getChallenges('locked');
      setChallenges(data);
    } catch (error) {
      console.error('Error loading challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChallenges();
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getProgressPercentage = (challenge: Challenge) => {
    if (challenge.total_checkins === 0) return 0;
    return (challenge.completed_checkins / challenge.duration_days) * 100;
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const daysLeft = getDaysRemaining(challenge.end_date);
    const progress = getProgressPercentage(challenge);
    const isEnded = daysLeft < 0;

    return (
      <TouchableOpacity
        key={challenge.id}
        style={[styles.card, isEnded && styles.cardEnded]}
        onPress={() => {
          if (isEnded) {
            router.push(`/challenge/judgment/${challenge.id}`);
          } else {
            router.push(`/challenge/${challenge.id}`);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {challenge.title}
          </Text>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {challenge.description}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {challenge.completed_checkins}/{challenge.duration_days} {t.completedDays}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.daysContainer}>
            <Ionicons name="calendar" size={20} color="#6366f1" />
            <Text style={styles.daysText}>
              {isEnded ? (
                <Text style={styles.endedText}>Time to judge!</Text>
              ) : (
                `${daysLeft} ${daysLeft === 1 ? t.dayLeft : t.daysLeft}`
              )}
            </Text>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={20} color="#f59e0b" />
            <Text style={styles.streakText}>
              {challenge.completed_checkins} {t.streak}
            </Text>
          </View>
        </View>

        {isEnded && (
          <View style={styles.judgmentBanner}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.judgmentText}>{t.finalJudgment}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.activeChallenges}</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>{t.noChallenges}</Text>
            <Text style={styles.emptyDescription}>{t.noActiveChallengesDesc}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createButtonText}>{t.createChallenge}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          challenges.map(renderChallengeCard)
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardEnded: {
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lockBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 6,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '600',
  },
  endedText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '600',
  },
  judgmentBanner: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  judgmentText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
