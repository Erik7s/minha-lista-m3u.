import { Stack } from 'expo-router';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="challenge/[id]" />
        <Stack.Screen name="challenge/judgment/[id]" />
        <Stack.Screen name="challenge/celebration/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </LanguageProvider>
  );
}
