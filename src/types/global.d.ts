// Minimal local type declarations to silence missing external types during development

// Vite client types (basic)
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_PUBLIC_PATH?: string;
    // add more VITE_ env vars here as needed
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Fallback for react/jsx-runtime when types are not installed
declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export function jsxDEV(type: any, props?: any, key?: any): any;
}

// Basic JSX intrinsic elements to avoid implicit any for JSX tags
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Fallback module declarations for packages that may not be installed in this environment
declare module 'react' {
  export type ReactNode = any;
  export type ChangeEvent<T = any> = any;
  export interface FC<P = {}> {
    (props: P & { children?: ReactNode }): any;
  }
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export default any;
}

declare module '@tanstack/react-router' {
  import type { FC } from 'react';
  export const Link: FC<any>;
  export function useRouterState(arg: any): any;
  export function createFileRoute(path: string): any;
  export default any;
}

declare module '@tanstack/react-start' {
  export function useServerFn(fn: any): any;
  export function createServerFn(config: any): any;
  export function createMiddleware(config: any): any;
  export default any;
}

declare module 'lucide-react' {
  import type { FC } from 'react';
  export const Home: FC<any>;
  export const Activity: FC<any>;
  export const Sparkles: FC<any>;
  export const Bot: FC<any>;
  export const User: FC<any>;
  export const Plug: FC<any>;
  export const Calendar: FC<any>;
  export const ArrowLeft: FC<any>;
  export const Play: FC<any>;
  export const Square: FC<any>;
  export const TrendingUp: FC<any>;
  export const TrendingDown: FC<any>;
  export const Loader2: FC<any>;
  export const Zap: FC<any>;
  export const Lock: FC<any>;
  export const CheckCircle2: FC<any>;
  export const AlertCircle: FC<any>;
  export const RefreshCw: FC<any>;
  export const Copy: FC<any>;
  const _default: any;
  export default _default;
}

declare module 'sonner' {
  export const toast: {
    (message: string): any;
    success(message: string): any;
    error(message: string): any;
    warning?(message: string): any;
    promise?(promise: Promise<any>, options: any): any;
  };
  export default any;
}
