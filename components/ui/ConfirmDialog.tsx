// components/ui/ConfirmDialog.tsx
// Cross-platform confirmation + action menu dialogs.
// React Native's Alert and the browser's window.confirm don't render reliably
// on react-native-web (and inside some webviews), which made buttons feel
// "dead". These Modal-based dialogs work identically on web & native.

import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Platform,
} from 'react-native';
import { Colors, Radii, Spacing, Fonts, Shadows } from '../../constants/theme';

// ── Confirm dialog ────────────────────────────────────────────

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible, title, message,
  confirmLabel = 'Lanjut', cancelLabel = 'Batal',
  destructive, loading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.message}>{message}</Text> : null}
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={onCancel} activeOpacity={0.8} disabled={loading}>
              <Text style={s.btnCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, destructive ? s.btnDanger : s.btnConfirm]}
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={s.btnConfirmText}>{loading ? 'Memproses…' : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Action menu (replaces ActionSheet / Alert menu) ───────────

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onPress: () => void;
}

export function ActionMenu({
  visible, title, items, onClose,
}: {
  visible: boolean;
  title?: string;
  items: ActionMenuItem[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.menuCard}>
          {title ? <Text style={s.menuTitle}>{title}</Text> : null}
          {items.map((it, i) => (
            <TouchableOpacity
              key={i}
              style={[s.menuRow, i < items.length - 1 && s.menuDivider]}
              onPress={() => { onClose(); it.onPress(); }}
              activeOpacity={0.7}
            >
              {it.icon ? <View style={s.menuIcon}>{it.icon}</View> : null}
              <Text style={[s.menuLabel, it.destructive && { color: Colors.error }]}>{it.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.menuRow, s.menuCancel]} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.menuCancelText}>Batal</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(6px)' } as any : {}),
  },
  // Confirm card
  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl, padding: Spacing.xxl,
    gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.lg,
  },
  title: { fontSize: 19, fontFamily: Fonts.display.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  message: { fontSize: 14.5, color: Colors.textSecondary, fontFamily: Fonts.sans.regular, lineHeight: 21 },
  row: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn: { flex: 1, paddingVertical: 13, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  btnCancel: { backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border },
  btnCancelText: { fontSize: 15, fontFamily: Fonts.sans.bold, color: Colors.textSecondary },
  btnConfirm: { backgroundColor: Colors.primary },
  btnDanger: { backgroundColor: Colors.error },
  btnConfirmText: { fontSize: 15, fontFamily: Fonts.sans.bold, color: '#fff' },
  // Action menu card
  menuCard: {
    width: '100%', maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl, paddingVertical: Spacing.xs,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.lg,
  },
  menuTitle: {
    fontSize: 13, fontFamily: Fonts.sans.bold, color: Colors.textTertiary,
    textAlign: 'center', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: 15 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  menuIcon: { width: 22, alignItems: 'center' },
  menuLabel: { fontSize: 15.5, fontFamily: Fonts.sans.semibold, color: Colors.textPrimary },
  menuCancel: { justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  menuCancelText: { fontSize: 15, fontFamily: Fonts.sans.bold, color: Colors.textSecondary, textAlign: 'center', flex: 1 },
});

export default ConfirmDialog;
