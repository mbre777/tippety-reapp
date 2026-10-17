import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Toolbar } from '@/components/Toolbar';
import { SportProvider, useSport } from '@/sport/SportContext';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function Shell() {
  const { c } = useTheme();
  const { sport } = useSport();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={sport === 'football' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: c.bg } }} />
      <Toolbar />
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <SportProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SportProvider>
    </SafeAreaProvider>
  );
}
