interface ISharedWhitelabelLayoutRailsItem {
  name: string;
  icon: string;
  action: 'REDIRECT';
  redirectTo?: string;
  externalRedirect?: boolean;
}

interface ISharedWhitelabelLayoutRails {
  items: ISharedWhitelabelLayoutRailsItem[];
}

export interface ISharedWhitelabelLayout {
  rails: ISharedWhitelabelLayoutRails;
}
