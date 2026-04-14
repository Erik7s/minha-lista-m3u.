import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { api, Challenge } from '../../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JudgmentScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleJudgment = async (wasHonest: boolean) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await api.submitJudgment(id as string, wasHonest);
      if (wasHonest) {
        router.replace(`/challenge/celebration/${id}`);
      } else {
        Alert.alert(
          t.reflection,
          t.reflectionQuotes[Math.floor(Math.random() * t.reflectionQuotes.length)],
          [
            {
              text: t.backToHome,
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting judgment:', error);
      Alert.alert('Error', error.message || 'Failed to submit judgment');
    } finally {
      setSubmitting(false);
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
      <View style={styles.header}>
        <TouchableOpacity testID="judgment-back-btn" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.finalJudgment}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="scale" size={80} color="#6366f1" />
        </View>

        <Text style={styles.challengeTitle} testID="judgment-challenge-title">
          {challenge.title}
        </Text>

        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{challenge.completed_checkins}</Text>
            <Text style={styles.statLabel}>{t.completedDays}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{challenge.duration_days}</Text>
            <Text style={styles.statLabel}>{t.duration}</Text>
          </View>
        </View>

        <Text style={styles.question} testID="judgment-question">
          {t.judgmentQuestion}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            testID="judgment-honest-btn"
            style={styles.honestButton}
            onPress={() => handleJudgment(true)}
            disabled={submitting}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.honestButtonText}>{t.wasHonest}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="judgment-not-honest-btn"
            style={styles.notHonestButton}
            onPress={() => handleJudgment(false)}
            disabled={submitting}
          >
            <Ionicons name="refresh-circle" size={28} color="#f59e0b" />
            <Text style={styles.notHonestButtonText}>{t.wasNotHonest}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  honestButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
  },
  honestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  notHonestButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  notHonestButtonText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
