import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

declare global {
  // Hjälpfunktion för tester som behöver simulera ändrad fönsterstorlek
  function resizeWindow(width: number, height: number): void;
}

// Förhindrar att axios gör riktiga XHR-anrop i jsdom-miljön
(globalThis as { XMLHttpRequest?: typeof XMLHttpRequest }).XMLHttpRequest = undefined;

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => {
      values.clear();
    },
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

// Node 26 exponerar valfria storage-globaler som är undefined utan konfigurerad backing-fil.
// Tillhandahåll webbläsarkompatibel in-memory-storage så att persisterade Zustand-stores fungerar i jsdom.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: createMemoryStorage(),
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: createMemoryStorage(),
});

globalThis.resizeWindow = (width: number, height: number) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
};

// Mock av IntersectionObserver som saknas i jsdom
class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

vi.mock('next/image', () => ({
  __esModule: true,
  default: () => {
    return 'Next image stub';
  },
}));

vi.mock('next/router', () => ({
  push: vi.fn().mockImplementation(() => Promise.resolve()),
  back: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
  },
  query: {},
  route: '',
  beforePopState: vi.fn(() => null),
  __esModule: true,
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: vi.fn().mockImplementation(() => Promise.resolve()),
    events: {
      on: vi.fn(),
      off: vi.fn(),
    },
    beforePopState: vi.fn(() => null),
    prefetch: vi.fn(() => null),
  }),
}));
