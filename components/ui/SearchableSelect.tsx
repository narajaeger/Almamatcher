// components/ui/SearchableSelect.tsx
// A text input with autocomplete suggestions. Free text is always allowed —
// the suggestion list only helps; users can type anything not on the list.
// Suggestions render inline (below the field) so it behaves correctly inside
// bottom sheets / ScrollViews on both web and native.

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Radii, Fonts } from '../../constants/theme';
import Icon from './Icon';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  options: string[];
  placeholder?: string;
  /** Called when a suggestion is tapped (after value is set). */
  onSelect?: (v: string) => void;
  maxSuggestions?: number;
  accent?: string;
  inputStyle?: any;
}

export default function SearchableSelect({
  value, onChangeText, options, placeholder,
  onSelect, maxSuggestions = 6, accent = Colors.primary, inputStyle,
}: Props) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const o of options) {
      const lo = o.toLowerCase();
      if (lo === q) continue; // exact match — nothing to suggest
      if (lo.startsWith(q)) starts.push(o);
      else if (lo.includes(q)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, maxSuggestions);
  }, [value, options, maxSuggestions]);

  const showList = focused && matches.length > 0;

  return (
    <View>
      <View style={styles.inputWrap}>
        <Icon name="search" size={15} color={Colors.textTertiary} weight={2} />
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setFocused(true)}
          // delay so a suggestion tap registers before the list hides
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={14} color={Colors.textTertiary} weight={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showList && (
        <View style={styles.list}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }} nestedScrollEnabled>
            {matches.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.item}
                activeOpacity={0.7}
                onPress={() => {
                  onChangeText(m);
                  onSelect?.(m);
                  setFocused(false);
                }}
              >
                <Text style={styles.itemText} numberOfLines={1}>{m}</Text>
                <Icon name="plus" size={13} color={accent} weight={2.4} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.background,
    borderRadius: Radii.md, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 2,
  },
  input: {
    flex: 1, paddingVertical: 11,
    fontSize: 15, color: Colors.textPrimary, fontFamily: Fonts.sans.regular,
  },
  list: {
    marginTop: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemText: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontFamily: Fonts.sans.regular },
});
