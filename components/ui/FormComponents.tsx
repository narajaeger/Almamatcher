// components/ui/FormComponents.tsx — Shared form UI

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { Colors, Radii, Spacing, Shadows } from '../../constants/theme';

// ============================================
// StyledInput
// ============================================
interface StyledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  maxLength?: number;
  error?: string;
}

export function StyledInput({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', multiline = false,
  maxLength, error,
}: StyledInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {maxLength && (
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      )}
    </View>
  );
}

// ============================================
// SelectPicker
// ============================================
interface SelectPickerProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function SelectPicker({
  label, value, options, onSelect, placeholder = 'Pilih...', error,
}: SelectPickerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectBtn, error ? styles.inputError : null]}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value ?? placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === value && styles.modalOptionSelected]}
                  onPress={() => { onSelect(item); setVisible(false); }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    item === value && styles.modalOptionTextSelected,
                  ]}>
                    {item}
                  </Text>
                  {item === value && (
                    <View style={styles.checkDot} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================
// ChipSelector
// ============================================
interface ChipSelectorProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  maxSelect?: number;
  error?: string;
}

export function ChipSelector({
  label, options, selected, onToggle, maxSelect, error,
}: ChipSelectorProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {maxSelect && (
          <Text style={styles.labelHint}>Maks {maxSelect}</Text>
        )}
      </View>
      <View style={styles.chipContainer}>
        {options.map((item) => {
          const isSelected = selected.includes(item);
          const isDisabled = !isSelected && maxSelect !== undefined && selected.length >= maxSelect;
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
              ]}
              onPress={() => !isDisabled && onToggle(item)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ============================================
// GenderSelector
// ============================================
interface GenderSelectorProps {
  value: 'male' | 'female' | null;
  onChange: (v: 'male' | 'female') => void;
  error?: string;
}

export function GenderSelector({ value, onChange, error }: GenderSelectorProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderRow}>
        {(['male', 'female'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderBtn, value === g && styles.genderBtnSelected]}
            onPress={() => onChange(g)}
            activeOpacity={0.7}
          >
            <Text style={[styles.genderText, value === g && styles.genderTextSelected]}>
              {g === 'male' ? 'Laki-laki' : 'Perempuan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ============================================
// PrimaryButton
// ============================================
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function PrimaryButton({ title, onPress, disabled, loading, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textInverse : Colors.primary} size="small" />
      ) : (
        <Text style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'ghost' && styles.buttonTextGhost,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// NumberStepper
// ============================================
interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}

export function NumberStepper({ label, value, onChange, min, max, step = 1, unit }: NumberStepperProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.max(min, value - step))}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperValue}>
          <Text style={styles.stepperNum}>{value}</Text>
          <Text style={styles.stepperUnit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.min(max, value + step))}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
    marginBottom: Spacing.sm,
  },
  labelHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: Colors.primaryMid,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Select
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textTertiary,
    marginTop: -2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    maxHeight: '70%',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    paddingTop: Spacing.lg,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionSelected: {
    // subtle — don't add background
  },
  modalOptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  modalOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
  },

  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryMid,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Radii.lg,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderBtnSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryMid,
  },
  genderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Button
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primaryMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },
  buttonTextSecondary: {
    color: Colors.primary,
  },
  buttonTextGhost: {
    color: Colors.textTertiary,
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepperBtnText: {
    fontSize: 22,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperNum: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepperUnit: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
