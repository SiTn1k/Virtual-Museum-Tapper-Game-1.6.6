import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Telegram WebApp API
Object.defineProperty(window, 'Telegram', {
  value: {
    WebApp: {
      initDataUnsafe: {
        user: { id: 123456789 },
      },
      initData: 'test_init_data',
      ready: vi.fn(),
      expand: vi.fn(),
      enableClosingConfirmation: vi.fn(),
      disableClosingConfirmation: vi.fn(),
      onEvent: vi.fn(),
      offEvent: vi.fn(),
      sendData: vi.fn(),
      close: vi.fn(),
      MainButton: {
        text: '',
        color: '',
        textColor: '',
        show: vi.fn(),
        hide: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        showProgress: vi.fn(),
        hideProgress: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn(),
        setText: vi.fn(),
        setColor: vi.fn(),
        setTextColor: vi.fn(),
      },
      BackButton: {
        show: vi.fn(),
        hide: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn(),
      },
      SettingsButton: {
        show: vi.fn(),
        hide: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn(),
      },
    },
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: false,
    PROD: true,
    MODE: 'test',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
  },
  writable: true,
});

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('ReactDOM.render'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});
