/**
 * Style for horizontal chip/tab rows. React Native gives horizontal ScrollViews flexGrow/flexShrink 1,
 * so inside a column next to a flexible list they get squeezed and their chips are clipped.
 * Sizing the row to its content avoids that.
 */
export const hScrollFixed = { flexGrow: 0, flexShrink: 0 } as const;
