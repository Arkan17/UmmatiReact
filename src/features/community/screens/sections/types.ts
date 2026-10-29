import type React from 'react';

/**
 * Every Community section renders its own FlatList and puts `header` (the hub's hero + section
 * switcher) at the top via ListHeaderComponent, so the whole page scrolls together.
 */
export interface SectionProps {
  header: React.ReactElement;
  /** Space taken by the floating tab bar: use for list paddingBottom and FAB `bottom`. */
  bottomInset: number;
}
