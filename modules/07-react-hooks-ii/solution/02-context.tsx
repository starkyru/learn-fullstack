import { createContext, useContext, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const ThemeStateContext = createContext<Theme>("light");
const ThemeSetterContext = createContext<(theme: Theme) => void>(() => {});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  // setTheme from useState is a STABLE identity → setter-only consumers never re-render.
  return (
    <ThemeSetterContext.Provider value={setTheme}>
      <ThemeStateContext.Provider value={theme}>{children}</ThemeStateContext.Provider>
    </ThemeSetterContext.Provider>
  );
}

export function useThemeState(): Theme {
  return useContext(ThemeStateContext);
}
export function useThemeSetter(): (theme: Theme) => void {
  return useContext(ThemeSetterContext);
}
