import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, Challenge } from '../../utils/api';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const { t } = useLanguage();
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [failedChallenges, setFailedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const allChallenges = await api.getChallenges();
      const completed = allChallenges.filter((c) => c.status === 'completed');
      const failed = allChallenges.filter((c) => c.status === 'failed');
      setCompletedChallenges(completed);
      setFailedChallenges(failed);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderChallengeCard = (challenge: Challenge, isCompleted: boolean) => {
    return (
      <View key={challenge.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.successBadge : styles.failedBadge,
            ]}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'refresh-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {isCompleted ? t.completed : t.failed}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{challenge.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {challenge.description}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="checkmark" size={16} color="#10b981" />
            <Text style={styles.statText}>
              {challenge.completed_checkins}/{challenge.duration_days}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {format(new Date(challenge.start_date), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        {isCompleted && (
          <View style={styles.rewardContainer}>
            <Ionicons name="gift" size={16} color="#10b981" />
            <Text style={styles.rewardText} numberOfLines={2}>
              {challenge.reward}
            </Text>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>{t.history}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {completedChallenges.length === 0 && failedChallenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>{t.noHistory}</Text>
          </View>
        ) : (
          <>
            {completedChallenges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={24} color="#10b981" />
                  <Text style={styles.sectionTitle}>{t.completedChallenges}</Text>
                </View>
                {completedChallenges.map((challenge) =>
                  renderChallengeCard(challenge, true)
                )}
              </View>
            )}

            {failedChallenges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb" size={24} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>{t.failedChallenges}</Text>
                </View>
                {failedChallenges.map((challenge) =>
                  renderChallengeCard(challenge, false)
                )}
              </View>
            )}
          </>
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  successBadge: {
    backgroundColor: '#10b981',
  },
  failedBadge: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  statsContainer: {
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
    marginLeft: 4,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});
