import { Text, View } from 'react-native';

export function SdaoWebUnavailable() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FAFAFA' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#181D27', textAlign: 'center' }}>
        SDAO (web)
      </Text>
      <Text style={{ fontSize: 15, color: '#535862', marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
        Scholarship tables run in the browser only. Run{' '}
        <Text style={{ fontWeight: '600' }}>npm run web</Text>, then open{' '}
        <Text style={{ fontWeight: '600' }}>/sdao</Text>.
      </Text>
    </View>
  );
}
