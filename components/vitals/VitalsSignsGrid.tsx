import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxArrowUpIcon } from '@/components/icons/IconsaxArrowUpIcon';
import type { LatestVitals } from '@/lib/vitals/vitalsApi';
import { buildVitalsGridRows } from '@/lib/vitals/vitalsDisplay';
import { healthUiText } from '@/lib/typography/healthUiText';
import { SCHEDULE_PARTNER } from '@/lib/ui/theme';
import { androidPressProps } from '@/lib/ui/androidPress';

type VitalsSignsGridProps = {
  vitals: LatestVitals;
  /** Card subtext under the section title (shown when expanded). */
  subtitle?: string;
  /** Tap header to expand/collapse — used on consultation summary. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

function GridCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Text style={healthUiText.detailLabel}>{label}</Text>
      <Text selectable style={healthUiText.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function VitalsGridBody({ vitals }: { vitals: LatestVitals }) {
  const rows = buildVitalsGridRows(vitals);
  const topRow = rows.slice(0, 3);
  const bottomRow = rows.slice(3, 6);

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {topRow.map((cell) => (
          <GridCell key={cell.label} label={cell.label} value={cell.value} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {bottomRow.map((cell) => (
          <GridCell key={cell.label} label={cell.label} value={cell.value} />
        ))}
      </View>
    </View>
  );
}

/**
 * Six-field vitals grid — Figma consultation summary / vital signs layout.
 */
export function VitalsSignsGrid({
  vitals,
  subtitle = 'Recorded by the nurse before this consultation.',
  collapsible = false,
  defaultExpanded = true,
}: VitalsSignsGridProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? expanded : true;

  const header = collapsible ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={isOpen ? 'Collapse vital signs' : 'Expand vital signs'}
      onPress={() => setExpanded((open) => !open)}
      {...androidPressProps({ hitSlop: 4 })}
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      })}>
      <View style={{ flex: 1, gap: isOpen ? 6 : 0 }}>
        <Text accessibilityRole="header" style={healthUiText.sectionEyebrow}>
          Vital Signs
        </Text>
        {isOpen ? <Text style={healthUiText.sectionDescription}>{subtitle}</Text> : null}
      </View>
      {isOpen ? (
        <IconsaxArrowUpIcon size={18} color="#A7A7A7" />
      ) : (
        <IconsaxArrowDownIcon size={18} color="#A7A7A7" />
      )}
    </Pressable>
  ) : (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={healthUiText.sectionEyebrow}>
        Vital Signs
      </Text>
      <Text style={healthUiText.sectionDescription}>{subtitle}</Text>
    </View>
  );

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: SCHEDULE_PARTNER.cardBorder,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: isOpen ? 20 : 16,
        gap: isOpen ? 16 : 0,
      }}>
      {header}

      {isOpen ? (
        <>
          <View style={{ height: 1, backgroundColor: SCHEDULE_PARTNER.divider, width: '100%' }} />
          <VitalsGridBody vitals={vitals} />
        </>
      ) : null}
    </View>
  );
}
