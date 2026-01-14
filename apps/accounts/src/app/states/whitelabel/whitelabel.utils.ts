import chroma from 'chroma-js';
import {
  ApplicationTheme,
  IWhitelabelApi,
  IWhitelabelState,
} from './whitelabel.types';
import { environment } from '../../../environments/environment';

export function applyDynamicColorPalette(
  baseColor: string,
  theme: ApplicationTheme = 'light',
) {
  const htmlStyle = document.documentElement.style;
  const bodyStyle = document.body.style;
  
  const vars = [
    '--primary',
    '--primary-foreground',
    '--ring',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-ring'
  ];

  if (!baseColor) {
     vars.forEach(v => {
         htmlStyle.removeProperty(v);
         bodyStyle.removeProperty(v);
     });
     return;
  }

  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const base = chroma(baseColor);
  
  // // Use base color for primary.
  // const primary = base;

  // // Calculate contrast for foreground
  // const white = '#f6fafe';
  // const black = '#000000';
  // const threshold = 4.5;
  // const onPrimary = chroma.contrast(primary, white) >= threshold ? white : black;

  // const cssProperties: { [key: string]: string } = {
  //   '--primary': primary.css(),
  //   '--primary-foreground': onPrimary,
  //   '--ring': primary.css(),
  //   '--sidebar-primary': primary.css(),
  //   '--sidebar-primary-foreground': onPrimary,
  //   '--sidebar-ring': primary.css(),
  // };

  // Object.entries(cssProperties).forEach(([key, value]) => {
  //     htmlStyle.setProperty(key, value);
  //     bodyStyle.setProperty(key, value);
  // });
}

export const oppositeTheme: Record<ApplicationTheme, ApplicationTheme> = {
  light: 'dark',
  dark: 'light',
  system: 'system',
};

export function getWhitelabelDefaultValue() {
  let initialState = {
    theme: <ApplicationTheme>'system',
    primaryColor: '',
    logo: '',
    icon: '',
  } as IWhitelabelState;

  try {
    const raw = localStorage.getItem('whitelabel');
    if (raw) {
      const parsed: IWhitelabelApi = JSON.parse(raw);
      initialState = {
        ...initialState,
        ...parsed,
      };
    }
  } catch {
    console.error('[WhitelabelService] ERROR parsing data from localstorage');
  }

  return initialState;
}

export const applicationRedirectDirectionary: Record<string, string> = {
  docs: environment.docsEndpoint,
};
