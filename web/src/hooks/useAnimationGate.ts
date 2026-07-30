import { useTheme } from '../context/ThemeContext';

export function useAnimationGate(): boolean {
  const { theme } = useTheme();
  if (!theme.animationEnabled) return false;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}
