// components/ui/FormComponents.tsx
// Komponen form yang dipakai di Onboarding & Edit Profile

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Pressable,
} from 'react-native';

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
    <View style={styles.inputWrapper}>
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
        placeholderTextColor="#9CA3AF"
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
// SelectPicker — dropdown sederhana
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
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectButton, error ? styles.inputError : null]}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
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
                  {item === value && <Text style={styles.checkmark}>✓</Text>}
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
// ChipSelector — pilih multiple dari list
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
    <View style={styles.inputWrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {maxSelect && (
          <Text style={styles.labelHint}>Pilih max {maxSelect}</Text>
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
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderRow}>
        {(['male', 'female'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderButton, value === g && styles.genderButtonSelected]}
            onPress={() => onChange(g)}
          >
            <Text style={styles.genderEmoji}>{g === 'male' ? '👨' : '👩'}</Text>
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
      activeOpacity={0.8}
    >
      <Text style={[
        styles.buttonText,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'ghost' && styles.buttonTextGhost,
      ]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// NumberStepper — untuk tinggi/berat
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
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperValue}>
          <Text style={styles.stepperValueNum}>{value}</Text>
          <Text style={styles.stepperValueUnit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.min(max, value + step))}
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
  inputWrapper: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#EC4899',
    backgroundColor: '#FFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  // Select
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: 16,
    color: '#111827',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#FDF2F8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: '#EC4899',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#EC4899',
  },
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#FCE7F3',
    borderColor: '#EC4899',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#EC4899',
    fontWeight: '600',
  },
  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  genderButtonSelected: {
    backgroundColor: '#FCE7F3',
    borderColor: '#EC4899',
  },
  genderEmoji: { fontSize: 28 },
  genderText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  genderTextSelected: { color: '#EC4899', fontWeight: '700' },
  // Button
  button: {
    backgroundColor: '#EC4899',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  buttonTextSecondary: {
    color: '#EC4899',
  },
  buttonTextGhost: {
    color: '#9CA3AF',
  },
  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  stepperBtnText: {
    fontSize: 24,
    color: '#374151',
    lineHeight: 28,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepperValueNum: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  stepperValueUnit: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
