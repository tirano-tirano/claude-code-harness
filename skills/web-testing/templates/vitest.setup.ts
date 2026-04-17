import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// Next.js router のモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Next.js Image のモック
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// window.matchMedia のモック（レスポンシブ対応コンポーネント用）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver のモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver のモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// fetch のモック（必要に応じてコメント解除）
// global.fetch = vi.fn();

// 環境変数のモック（必要に応じて追加）
// vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api');

// コンソールエラーの抑制（特定のエラーのみ）
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // React の act() 警告を抑制
  if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
    return;
  }
  originalError(...args);
};
