import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FONT_SCALE } from "@/constants";

type ColorScheme = "light" | "dark";

interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  destructive: string;
  gradientPrimary: string[];
  gradientHover: string[];
}

interface ThemeContextType {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  fontScale: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  getScaledSize: (baseSize: number) => number;
}

const lightColors: ThemeColors = {
  background: "#ffffff",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#1e293b",
  primaryForeground: "#f8fafc",
  secondary: "#f1f5f9",
  secondaryForeground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  input: "#e2e8f0",
  destructive: "#ef4444",
  gradientPrimary: ["#c084fc", "#d8b4fe"], // violet-400 to violet-300
  gradientHover: ["#a855f7", "#c084fc"], // violet-500 to violet-400
};

const darkColors: ThemeColors = {
  background: "#333333",
  foreground: "#eeeeee",
  card: "#383838",
  cardForeground: "#eeeeee",
  primary: "#f8fafc",
  primaryForeground: "#1e293b",
  secondary: "#1e293b",
  secondaryForeground: "#f8fafc",
  muted: "#7c8a99",
  mutedForeground: "#94a3b8",
  border: "#1a2332",
  input: "#2e2e2e",
  destructive: "#8b1a1a",
  gradientPrimary: ["#c084fc", "#d8b4fe"], // Same in dark mode
  gradientHover: ["#a855f7", "#c084fc"], // Same in dark mode
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const FONT_SCALE_KEY = "@font_scale";

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );
  const [fontScale, setFontScale] = useState<number>(FONT_SCALE.default);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({ colorScheme: newColorScheme }) => {
        const newScheme = newColorScheme === "dark" ? "dark" : "light";
        setColorScheme(newScheme);
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SCALE_KEY).then((value) => {
      if (value) {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          setFontScale(parsed);
        }
      }
    });
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontScale((prev) => {
      const next = Math.min(prev + FONT_SCALE.step, FONT_SCALE.max);
      AsyncStorage.setItem(FONT_SCALE_KEY, next.toString());
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontScale((prev) => {
      const next = Math.max(prev - FONT_SCALE.step, FONT_SCALE.min);
      AsyncStorage.setItem(FONT_SCALE_KEY, next.toString());
      return next;
    });
  }, []);

  const getScaledSize = useCallback(
    (baseSize: number) => Math.round(baseSize * fontScale),
    [fontScale]
  );

  const colors = colorScheme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        colorScheme,
        fontScale,
        increaseFontSize,
        decreaseFontSize,
        getScaledSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
