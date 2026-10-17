import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { SHEET_OVERLAP } from './AppHeader';
import { TOOLBAR_SPACE } from './Toolbar';

/** Header + abgerundetes Sheet, das über den Header läuft. `fixedFooter` klebt über der Toolbar. */
export function Screen({ header, children, footer, fixedFooter, fixedFooterHeight = 110 }: { header: ReactNode; children: ReactNode; footer?: ReactNode; fixedFooter?: ReactNode; fixedFooterHeight?: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = TOOLBAR_SPACE + insets.bottom;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 36 + (fixedFooter ? fixedFooterHeight : 0) }} showsVerticalScrollIndicator={false}>
        {header}
        <View style={{ marginTop: -SHEET_OVERLAP, backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 18, minHeight: 600 }}>
          {children}
          {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
        </View>
      </ScrollView>
      {fixedFooter ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: bottom - 6, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, backgroundColor: c.bg }}>{fixedFooter}</View>
      ) : null}
    </View>
  );
}
