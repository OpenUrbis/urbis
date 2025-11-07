export type ApplicationTheme = 'light' | 'dark';

export interface IWhitelabelLocalStorage {
  theme: ApplicationTheme;
  primaryColor: string;
  logo: string;
  icon: string;
}

export interface IWhitelabelState extends IWhitelabelLocalStorage {
  loading: boolean;
}
