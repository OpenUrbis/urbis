export type ApplicationTheme = 'light' | 'dark';
export const DEFAULTS = {
  application: {
    name: 'accounts',
  },
  whitelabel: {
    theme: <ApplicationTheme>'light',
    primaryColor: '',
    logo: '',
    icon: '',
  },
} as const;

export interface IWhitelabelLocalStorage {
  theme: ApplicationTheme;
  primaryColor: string;
  logo: string;
  icon: string;
}

export interface IWhitelabelState extends IWhitelabelLocalStorage {
  loading: boolean;
}
