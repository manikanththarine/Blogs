import type { RouteData } from './routeData';

declare global {
  interface Window {
    __INITIAL_DATA__?: RouteData;
  }
}

export {};
