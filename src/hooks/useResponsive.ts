import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@/constants';

export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isTablet: width >= BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.desktop,
    width,
  };
}
