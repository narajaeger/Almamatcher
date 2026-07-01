// lib/fontPatch.ts
// One-time global typography upgrade. Maps each Text/TextInput's fontWeight (and
// size) to the matching loaded font file — so every screen adopts Sora (headings)
// + Plus Jakarta Sans (body) WITHOUT editing each style by hand.
//
// Native only: React Native ignores fontWeight once a weight-specific fontFamily is
// set, so we resolve the right family here. On web the CSS in app/+html.tsx already
// applies the fonts (and real fontWeight works there), so we skip the patch.

import React from 'react';
import { Platform, StyleSheet, Text, TextInput } from 'react-native';
import { Fonts } from '../constants/theme';

function familyFor(weight: unknown, fontSize: unknown): string {
  const w = String(weight ?? '400');
  const size = typeof fontSize === 'number' ? fontSize : 0;
  const heavy = w === '700' || w === '800' || w === '900' || w === 'bold';
  const semi = w === '600';
  const medium = w === '500';
  const extra = w === '800' || w === '900';

  // Headings → Sora display for a clear hierarchy step above body text.
  // Heavy weights from 18px, and large semibold titles from 20px, get Sora.
  if (heavy && size >= 18) {
    return extra ? Fonts.display.extrabold : Fonts.display.bold;
  }
  if (semi && size >= 20) return Fonts.display.bold;
  if (extra) return Fonts.sans.extrabold;
  if (heavy) return Fonts.sans.bold;
  if (semi) return Fonts.sans.semibold;
  if (medium) return Fonts.sans.medium;
  return Fonts.sans.regular;
}

let patched = false;

export function applyGlobalFont() {
  if (patched || Platform.OS === 'web') return;
  patched = true;

  for (const Comp of [Text, TextInput] as any[]) {
    const orig = Comp.render;
    if (typeof orig !== 'function') continue;

    Comp.render = function patchedRender(...args: any[]) {
      const el = orig.apply(this, args);
      try {
        const flat = StyleSheet.flatten(el.props.style) || {};
        if (flat.fontFamily) return el; // respect explicit choices
        const fontFamily = familyFor(flat.fontWeight, flat.fontSize);
        return React.cloneElement(el, {
          style: [{ fontFamily }, el.props.style],
        });
      } catch {
        return el;
      }
    };
  }
}
