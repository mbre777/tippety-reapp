import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { SHEET_OVERLAP } from './AppHeader';
import { TOOLBAR_SPACE } from './Toolbar';

/** Header + abgerundetes Sheet, das über den Header läuft. */
export function Screen({ header, children, footer }: { header: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: TOOLBAR_SPACE + insets.bottom + 36 }} showsVerticalScrollIndicator={false}>
        {header}
        <View style={{ marginTop: -SHEET_OVERLAP, backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 18, minHeight: 600 }}>
          {children}
          {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}
