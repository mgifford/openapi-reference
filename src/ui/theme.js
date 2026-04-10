import { button, el, text } from "../render/components.js";

const THEME_STORAGE_KEY = "csv-explorer-theme";

export function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function getPreferredTheme() {
  return getStoredTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
}

export function storeThemePreference(theme) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures and continue using the in-memory theme.
  }
}

export function getThemeToggleContent(theme) {
  if (theme === "dark") {
    return {
      icon: "☀",
      label: "Switch to light mode"
    };
  }

  return {
    icon: "☾",
    label: "Switch to dark mode"
  };
}

export function createThemeToggle(onToggle) {
  const buttonEl = button("", onToggle, {
    id: "themeToggle",
    class: "theme-toggle",
    "aria-live": "off"
  });

  const iconEl = el("span", { class: "theme-toggle-icon", "aria-hidden": "true" }, []);
  const textEl = el("span", { class: "visually-hidden", id: "themeToggleLabel" }, []);
  buttonEl.appendChild(iconEl);
  buttonEl.appendChild(textEl);

  const update = (theme) => {
    const content = getThemeToggleContent(theme);
    iconEl.replaceChildren(text(content.icon));
    textEl.replaceChildren(text(content.label));
    buttonEl.setAttribute("aria-label", content.label);
    buttonEl.setAttribute("title", content.label);
    buttonEl.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  };

  return { buttonEl, update };
}
