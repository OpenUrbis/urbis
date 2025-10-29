export type ApplicationTheme = 'light' | 'dark';

export interface IWhitelabelState {
  loading: boolean;
  primaryColor: string | undefined;
  theme: ApplicationTheme;
}

export interface IWhitelabelLocalStorage {
  primaryColor: string;
  theme: ApplicationTheme;
}
