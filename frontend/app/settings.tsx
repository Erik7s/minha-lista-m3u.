import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>

          <TouchableOpacity
            testID="settings-lang-en"
            style={[styles.option, language === 'en' && styles.optionActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.flagText}>EN</Text>
            <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>
              English
            </Text>
            {language === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="settings-lang-pt"
            style={[styles.option, language === 'pt' && styles.optionActive]}
            onPress={() => setLanguage('pt')}
          >
            <Text style={styles.flagText}>PT</Text>
            <Text style={[styles.optionText, language === 'pt' && styles.optionTextActive]}>
              Portugues
            </Text>
            {language === 'pt' && (
              <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.appName}>Ethos</Text>
          <Text style={styles.appTagline}>
            Build Integrity, One Challenge at a Time
          </Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  optionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  flagText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 12,
    width: 30,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  optionTextActive: {
    fontWeight: '600',
    color: '#6366f1',
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
