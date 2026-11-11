// What the peer and the fixtures must agree on: one Nix interpolation written
// outside ASCII, and the code it stands for. The peer fills it with that code,
// so a caret after it sits at different UTF-16 columns in the host and in the
// prepared text.
export const labelGap = {
  host: '${cfg."ラベル 𝒳"}',
  code: '"héllo 日本語 𝒳"',
} as const;

/** Whether a gap's host text is `labelGap`, on one line or several. */
export const isLabelGap = (hostText: string): boolean => hostText.includes('cfg."ラベル 𝒳"');
