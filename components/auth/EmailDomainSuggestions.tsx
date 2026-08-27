import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

type Props = {
  domains: readonly string[];
  onSelect: (domain: string) => void;
};

/**
 * Pill tags under the login email field — tap to complete `@domain`.
 */
export function EmailDomainSuggestions({ domains, onSelect }: Props) {
  if (domains.length === 0) return null;

  return (
    <View style={styles.row} accessibilityRole="list">
      {domains.map((domain) => (
        <Pressable
          key={domain}
          onPress={() => onSelect(domain)}
          accessibilityRole="button"
          accessibilityLabel={`Use ${domain}`}
          {...androidPressProps({ hitSlop: 4 })}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
          <Text style={styles.chipText}>{domain}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipPressed: {
    opacity: 0.7,
    backgroundColor: '#E4E4E4',
  },
  chipText: {
    fontFamily: Inter.medium,
    fontSize: 12,
    color: '#6C6C6C',
    letterSpacing: -0.2,
  },
});
