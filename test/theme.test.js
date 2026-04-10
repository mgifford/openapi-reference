import { jest } from "@jest/globals";
import {
  applyTheme,
  createThemeToggle,
  getPreferredTheme,
  getStoredTheme,
  getSystemTheme,
  getThemeToggleContent,
  storeThemePreference
} from "../src/ui/theme.js";

describe("theme utilities", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    window.localStorage.clear();
  });

  test("uses stored theme preference when present", () => {
    window.localStorage.setItem("csv-explorer-theme", "dark");
    expect(getStoredTheme()).toBe("dark");
    expect(getPreferredTheme()).toBe("dark");
  });

  test("applies theme to the document root", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  test("stores theme preference", () => {
    storeThemePreference("light");
    expect(window.localStorage.getItem("csv-explorer-theme")).toBe("light");
  });

  test("provides accessible toggle labels for both themes", () => {
    expect(getThemeToggleContent("light")).toEqual({
      icon: "☾",
      label: "Switch to dark mode"
    });

    expect(getThemeToggleContent("dark")).toEqual({
      icon: "☀",
      label: "Switch to light mode"
    });
  });

  test("renders a toggle button with accessible name updates", () => {
    const { buttonEl, update } = createThemeToggle(() => {});
    update("light");
    expect(buttonEl.getAttribute("aria-label")).toBe("Switch to dark mode");
    expect(buttonEl.getAttribute("aria-pressed")).toBe("false");

    update("dark");
    expect(buttonEl.getAttribute("aria-label")).toBe("Switch to light mode");
    expect(buttonEl.getAttribute("aria-pressed")).toBe("true");
  });

  test("falls back to system preference when nothing is stored", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query
    }));

    expect(getSystemTheme()).toBe("dark");
    expect(getPreferredTheme()).toBe("dark");

    window.matchMedia = originalMatchMedia;
  });
});
