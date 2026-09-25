// Badging API: todavía no forma parte de lib.dom.d.ts en TypeScript.
export {};

declare global {
  interface Navigator {
    setAppBadge?(contents?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}
