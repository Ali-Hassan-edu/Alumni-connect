/**
 * Mobile-first responsive utility classes
 * Use these for consistent responsive behavior across the app
 */

export const responsiveClasses = {
  // Padding
  mobilePadding: 'p-4 sm:p-6 lg:p-8',
  mobileMargin: 'm-4 sm:m-6 lg:m-8',
  
  // Typography
  heading1: 'text-2xl sm:text-3xl lg:text-4xl',
  heading2: 'text-xl sm:text-2xl lg:text-3xl',
  heading3: 'text-lg sm:text-xl lg:text-2xl',
  body: 'text-sm sm:text-base lg:text-lg',
  
  // Layouts
  container: 'max-w-7xl mx-auto',
  gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  gridColsFull: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  
  // Forms
  inputHeight: 'h-10 sm:h-11 lg:h-12',
  buttonHeight: 'h-10 sm:h-11 lg:h-12',
  
  // Gaps
  gapSm: 'gap-2 sm:gap-3 lg:gap-4',
  gapMd: 'gap-3 sm:gap-4 lg:gap-6',
  gapLg: 'gap-4 sm:gap-6 lg:gap-8',
}

// Media query helpers
export const breakpoints = {
  mobile: '(max-width: 640px)',
  tablet: '(max-width: 1024px)',
  desktop: '(min-width: 1024px)',
}

// Touch-friendly sizes
export const touchFriendly = {
  button: 'min-h-12 min-w-12',    // 48x48px minimum
  input: 'min-h-12 px-4 py-3',    // 48px height
  tap: 'tap-highlight-color-transparent',
}
