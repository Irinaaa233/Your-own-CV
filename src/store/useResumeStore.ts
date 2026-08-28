import { create } from "zustand";
import { getDefaultTemplate, DEFAULT_CSS_TEMPLATE } from "@/utils/templates";
import { DEFAULT_SETTINGS, type ResumeSettings } from "@/utils/settings";

type Language = "zh" | "en";

type PhotoError = { type: "size" | "type"; message: string } | null;

interface ResumeState {
  content: string;
  customCSS: string;
  language: Language;
  settings: ResumeSettings;
  settingsOpen: boolean;
  lastSavedAt: number | null;
  hasSelectedTemplate: boolean;
  photoDataUrl: string | null;
  photoError: PhotoError;
  setContent: (content: string) => void;
  setCustomCSS: (css: string) => void;
  setLanguage: (language: Language) => void;
  setSettings: (partial: Partial<ResumeSettings>) => void;
  resetSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  loadTemplate: (lang?: Language) => void;
  selectTemplate: (lang: Language) => void;
  setPhotoFromFile: (file: File) => Promise<void>;
  setPhotoDataUrl: (dataUrl: string | null) => void;
  clearPhotoError: () => void;
  touchSaved: () => void;
  resetToWelcome: () => void;
}

const STORAGE_KEY_CONTENT = "resume_markdown_content";
const STORAGE_KEY_CSS = "resume_custom_css";
const STORAGE_KEY_LANG = "resume_language";
const STORAGE_KEY_SETTINGS = "resume_settings";
const STORAGE_KEY_INITIALIZED = "resume_initialized";
const STORAGE_KEY_PHOTO = "resume_photo_dataurl";

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

const readInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "zh";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LANG);
    if (raw === "zh" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "zh";
  return nav.toLowerCase().startsWith("zh") ? "zh" : "en";
};

const readInitialContent = (lang: Language): string => {
  if (typeof window === "undefined") return getDefaultTemplate(lang);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CONTENT);
    if (raw && raw.trim().length > 0) return raw;
  } catch {
    /* ignore */
  }
  return getDefaultTemplate(lang);
};

const readInitialCustomCSS = (): string => {
  if (typeof window === "undefined") return DEFAULT_CSS_TEMPLATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CSS);
    if (typeof raw === "string" && raw.length > 0) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_CSS_TEMPLATE;
};

const readInitialSettings = (): ResumeSettings => {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
};

const readHasSelectedTemplate = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY_INITIALIZED) === "true") {
      return true;
    }
    const existingContent = window.localStorage.getItem(STORAGE_KEY_CONTENT);
    if (existingContent && existingContent.trim().length > 0) {
      window.localStorage.setItem(STORAGE_KEY_INITIALIZED, "true");
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
};

const readInitialPhoto = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PHOTO);
    if (raw && raw.startsWith("data:image")) return raw;
  } catch {
    /* ignore (QuotaExceeded etc.) */
  }
  return null;
};

const initialLanguage = readInitialLanguage();
const initialHasSelected = readHasSelectedTemplate();
const initialPhoto = readInitialPhoto();

export const useResumeStore = create<ResumeState>((set, get) => ({
  content: initialHasSelected ? readInitialContent(initialLanguage) : "",
  customCSS: readInitialCustomCSS(),
  language: initialLanguage,
  settings: readInitialSettings(),
  settingsOpen: false,
  lastSavedAt: Date.now(),
  hasSelectedTemplate: initialHasSelected,
  photoDataUrl: initialPhoto,
  photoError: null,

  setContent: (content: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_CONTENT, content);
      } catch {
        /* ignore */
      }
    }
    set({ content, lastSavedAt: Date.now() });
  },

  setCustomCSS: (customCSS: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_CSS, customCSS);
      } catch {
        /* ignore */
      }
    }
    set({ customCSS, lastSavedAt: Date.now() });
  },

  setLanguage: (language: Language) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_LANG, language);
      } catch {
        /* ignore */
      }
    }
    set({ language });
  },

  setSettings: (partial: Partial<ResumeSettings>) => {
    const next = { ...get().settings, ...partial };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    set({ settings: next, lastSavedAt: Date.now() });
  },

  resetSettings: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY_SETTINGS);
      } catch {
        /* ignore */
      }
    }
    set({ settings: { ...DEFAULT_SETTINGS }, lastSavedAt: Date.now() });
  },

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  loadTemplate: (lang?: Language) => {
    const targetLang = lang ?? get().language;
    const template = getDefaultTemplate(targetLang);
    get().setContent(template);
  },

  selectTemplate: (lang: Language) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_INITIALIZED, "true");
        window.localStorage.setItem(STORAGE_KEY_LANG, lang);
      } catch {
        /* ignore */
      }
    }
    const template = getDefaultTemplate(lang);
    set({
      language: lang,
      content: template,
      hasSelectedTemplate: true,
      lastSavedAt: Date.now(),
    });
  },

  clearPhotoError: () => {
    set({ photoError: null });
  },

  resetToWelcome: () => {
    set({ hasSelectedTemplate: false });
  },

  setPhotoDataUrl: (dataUrl: string | null) => {
    if (typeof window !== "undefined") {
      try {
        if (dataUrl) {
          window.localStorage.setItem(STORAGE_KEY_PHOTO, dataUrl);
        } else {
          window.localStorage.removeItem(STORAGE_KEY_PHOTO);
        }
      } catch {
        /* ignore (QuotaExceeded etc.) */
      }
    }
    set({ photoDataUrl: dataUrl, photoError: null, lastSavedAt: Date.now() });
  },

  setPhotoFromFile: async (file: File) => {
    const lang = get().language;
    const MSGS = {
      zh: {
        size: `图片大小不能超过 3MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
        type: "仅支持 JPG / PNG / WebP / GIF / BMP 格式的图片",
      },
      en: {
        size: `Photo must be under 3 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        type: "Only JPG / PNG / WebP / GIF / BMP images are supported",
      },
    };
    const t = MSGS[lang];

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      set({ photoError: { type: "type", message: t.type } });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      set({ photoError: { type: "size", message: t.size } });
      return;
    }

    const reader = new FileReader();
    await new Promise<void>((resolve, reject) => {
      reader.onload = () => resolve();
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const dataUrl = reader.result as string;
    get().setPhotoDataUrl(dataUrl);
  },

  touchSaved: () => {
    set({ lastSavedAt: Date.now() });
  },
}));
