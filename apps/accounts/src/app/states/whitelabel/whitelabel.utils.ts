import chroma from 'chroma-js';
import {
  ApplicationTheme,
  IWhitelabelApi,
  IWhitelabelState,
} from './whitelabel.types';
import { environment } from '../../../environments/environment';

const m2ToneToM3: Record<number, number> = {
  100: 95,
  200: 90,
  300: 80,
  400: 70,
  500: 60,
  600: 50,
  700: 40,
  800: 30,
  850: 25,
  900: 20,
};

function buildShades(hue: number, saturation: number, flipShades = false) {
  const secondaryHue = (hue + 180) % 360;
  const tertiaryHue = (hue + 60) % 360;
  const errorHue = 0; // Red hue

  const secondarySaturation = saturation * 0.8;
  const tertiarySaturation = saturation * 0.9;
  const neutralSaturation = saturation * 0.4;

  const primaryShades: { [key: number]: string } = {};
  const secondaryShades: { [key: number]: string } = {};
  const tertiaryShades: { [key: number]: string } = {};
  const neutralVariantShades: { [key: number]: string } = {};
  const errorShades: { [key: number]: string } = {};
  const surfaceShades: { [key: string]: string } = {};

  for (let i = 0; i < 101; i++) {
    const luminance = 0 + i / 100;
    const index = flipShades ? 100 - i : i;
    primaryShades[index] = chroma.hsl(hue, saturation, luminance).css('hsl');
    secondaryShades[index] = chroma
      .hsl(secondaryHue, secondarySaturation, luminance)
      .css('hsl');
    tertiaryShades[index] = chroma
      .hsl(tertiaryHue, tertiarySaturation, luminance)
      .css('hsl');
    neutralVariantShades[index] = chroma
      .hsl(hue, neutralSaturation, luminance)
      .css('hsl');
    errorShades[index] = chroma.hsl(errorHue, 1, luminance).css('hsl');
  }

  const surfaceLuminance = !flipShades
    ? {
        dim: 0.94,
        bright: 0.98,
        containerLowest: 1.0,
        containerLow: 0.96,
        container: 0.94,
        containerHigh: 0.92,
        containerHighest: 0.9,
      }
    : {
        dim: 0.04,
        bright: 0.06,
        containerLowest: 0.03,
        containerLow: 0.08,
        container: 0.1,
        containerHigh: 0.12,
        containerHighest: 0.14,
      };

  for (const [variant, luminance] of Object.entries(surfaceLuminance)) {
    surfaceShades[variant] = chroma
      .hsl(hue, saturation * 0.1, luminance)
      .css('hsl');
  }

  return {
    primaryShades,
    secondaryShades,
    tertiaryShades,
    neutralVariantShades,
    errorShades,
    surfaceShades,
  };
}

export function applyDynamicColorPalette(
  baseColor: string,
  theme: ApplicationTheme = 'light',
  baseTone?: number,
) {
  const style = document.documentElement.style;
  const base = chroma(baseColor);

  // Extract hue, saturation, lightness
  const [hue, saturation, lightness] = base.hsl();

  const safeLightness = isNaN(lightness) ? 0.5 : lightness;
  const baseLightnessPercent = safeLightness * 100;
  const targetIndex = Math.round(baseLightnessPercent);
  const shadeIndex = theme === 'dark' ? 100 - targetIndex : targetIndex;
  const mainTone = baseTone ? m2ToneToM3[baseTone] : shadeIndex;

  const {
    primaryShades,
    secondaryShades,
    tertiaryShades,
    neutralVariantShades,
    errorShades,
    surfaceShades,
  } = buildShades(hue, saturation, theme === 'dark');

  const dividerLowContrastShade =
    theme === 'light'
      ? neutralVariantShades[96] || neutralVariantShades[95]
      : neutralVariantShades[95] || neutralVariantShades[98];

  // Calculate on- colors for accessibility (WCAG contrast ratio ≥ 4.5 for text)
  const getOnColor = (bgColor: string) => {
    const light = '#ffffff';
    const dark = '#000000';
    const threshold = theme === 'light' ? 2.1 : 4.5;
    return chroma.contrast(bgColor, light) >= threshold ? light : dark;
  };

  // Define all CSS custom properties with original naming
  const cssProperties: { [key: string]: string } = {
    '--mat-sys-on-background': getOnColor(neutralVariantShades[99]),
    '--mat-sys-primary': primaryShades[mainTone],
    '--mat-sys-on-primary': getOnColor(primaryShades[mainTone]),
    '--mat-sys-primary-container': primaryShades[95],
    '--mat-sys-on-primary-container': getOnColor(primaryShades[95]),
    '--mat-sys-secondary': secondaryShades[mainTone],
    '--mat-sys-on-secondary': getOnColor(secondaryShades[mainTone]),
    '--mat-sys-secondary-container': secondaryShades[95],
    '--mat-sys-on-secondary-container': getOnColor(secondaryShades[95]),
    '--mat-sys-tertiary': tertiaryShades[mainTone],
    '--mat-sys-on-tertiary': getOnColor(tertiaryShades[mainTone]),
    '--mat-sys-tertiary-container': tertiaryShades[95],
    '--mat-sys-on-tertiary-container': getOnColor(tertiaryShades[95]),
    '--mat-sys-error': errorShades[mainTone],
    '--mat-sys-on-error': getOnColor(errorShades[mainTone]),
    '--mat-sys-error-container': errorShades[95],
    '--mat-sys-on-error-container': getOnColor(errorShades[95]),
    '--mat-sys-surface': surfaceShades['container'],
    '--mat-sys-on-surface': getOnColor(surfaceShades['container']),
    '--mat-sys-surface-variant': dividerLowContrastShade,
    '--mat-sys-on-surface-variant': getOnColor(dividerLowContrastShade),
    '--mat-sys-surface-dim': surfaceShades['dim'],
    '--mat-sys-surface-bright': surfaceShades['bright'],
    '--mat-sys-surface-container-lowest': surfaceShades['containerLowest'],
    '--mat-sys-surface-container-low': surfaceShades['containerLow'],
    '--mat-sys-surface-container': surfaceShades['container'],
    '--mat-sys-surface-container-high': surfaceShades['containerHigh'],
    '--mat-sys-surface-container-highest': surfaceShades['containerHighest'],
    '--bs-secondary-color': getOnColor(surfaceShades['container']),
  };

  // Apply outline colors, adjusted for dark theme
  const outlineLuminance = theme === 'light' ? 0.6 : 0.4;
  cssProperties['--mat-sys-outline'] = chroma
    .hsl(hue, saturation * 0.3, outlineLuminance)
    .css('hsl');
  cssProperties['--mat-sys-outline-variant'] = chroma
    .hsl(hue, saturation * 0.2, outlineLuminance)
    .css('hsl');

  const cssString = Object.entries(cssProperties)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
  style.cssText = cssString;
}

export const oppositeTheme = {
  light: 'dark' as ApplicationTheme,
  dark: 'light' as ApplicationTheme,
};

export function getWhitelabelDefaultValue() {
  let initialState = {
    theme: <ApplicationTheme>'light',
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
