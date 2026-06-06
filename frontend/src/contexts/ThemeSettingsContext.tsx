import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

export interface ThemeSettings {
  mode: 'light' | 'dark';
  primaryColor: string;
  appName: string;
  iconDataUrl: string | null;
}

const DEFAULTS: ThemeSettings = {
  mode: 'light',
  primaryColor: '#1976d2',
  appName: 'Кафе ERP',
  iconDataUrl: null,
};

const LS_KEY = 'erp-ui-settings';

function fromLocalStorage(): ThemeSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function toLocalStorage(s: ThemeSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

async function apiFetch(): Promise<Partial<ThemeSettings>> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('settings fetch failed');
  const data = await res.json() as Record<string, string>;
  return {
    mode: (data.mode === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
    primaryColor: data.primaryColor || DEFAULTS.primaryColor,
    appName: data.appName || DEFAULTS.appName,
    iconDataUrl: data.iconDataUrl || null,
  };
}

async function apiSave(patch: Partial<ThemeSettings>): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  const body: Record<string, string> = {};
  if (patch.mode !== undefined)         body.mode         = patch.mode;
  if (patch.primaryColor !== undefined) body.primaryColor = patch.primaryColor;
  if (patch.appName !== undefined)      body.appName      = patch.appName;
  if (patch.iconDataUrl !== undefined)  body.iconDataUrl  = patch.iconDataUrl ?? '';
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

interface Ctx {
  settings: ThemeSettings;
  update: (patch: Partial<ThemeSettings>) => void;
  reset: () => void;
  saving: boolean;
}

const ThemeSettingsContext = createContext<Ctx>({
  settings: DEFAULTS,
  update: () => {},
  reset: () => {},
  saving: false,
});

export const useThemeSettings = () => useContext(ThemeSettingsContext);

export const ThemeSettingsProvider = ({ children }: { children: ReactNode }) => {
  // Start from localStorage so there's no visual flash while API loads
  const [settings, setSettings] = useState<ThemeSettings>(fromLocalStorage);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef  = useRef<Partial<ThemeSettings>>({});

  // On mount: sync from API (source of truth for all devices)
  useEffect(() => {
    apiFetch()
      .then(apiSettings => {
        setSettings(prev => {
          const merged = { ...prev, ...apiSettings };
          toLocalStorage(merged);
          return merged;
        });
      })
      .catch(() => { /* offline — keep localStorage */ });
  }, []);

  // Side effects: title + favicon
  useEffect(() => {
    document.title = settings.appName;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = settings.iconDataUrl ?? '/vite.svg';
  }, [settings.appName, settings.iconDataUrl]);

  const update = (patch: Partial<ThemeSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      toLocalStorage(next);
      return next;
    });

    pendingRef.current = { ...pendingRef.current, ...patch };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    debounceRef.current = setTimeout(() => {
      const toSave = pendingRef.current;
      pendingRef.current = {};
      apiSave(toSave)
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 600);
  };

  const reset = () => {
    setSettings(DEFAULTS);
    toLocalStorage(DEFAULTS);
    setSaving(true);
    apiSave(DEFAULTS).catch(() => {}).finally(() => setSaving(false));
  };

  return (
    <ThemeSettingsContext.Provider value={{ settings, update, reset, saving }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
};
