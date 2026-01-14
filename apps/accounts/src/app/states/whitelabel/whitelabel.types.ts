import { IOrganization } from '../../pages/organizations/dto/organization.dto';

export type ApplicationTheme = 'light' | 'dark' | 'system';
export type ApplicationName = 'accounts' | 'docs';

interface ISharedWhitelabelLayoutRailsItem {
  name: string;
  icon: string;
  action: 'REDIRECT';
  redirectTo?: string | ApplicationName;
  externalRedirect?: boolean;
}

interface ISharedWhitelabelLayoutRails {
  items: ISharedWhitelabelLayoutRailsItem[];
}

export interface ISharedWhitelabelLayout {
  rails: ISharedWhitelabelLayoutRails;
}

export interface IWhitelabelState extends IUnifiedWhitelabelApi {
  loading: boolean;
}

export interface IUpdateWhitelabelDto {
  theme?: ApplicationTheme | null;
  primaryColor?: string | null;
}

export interface IApplicationWhitelabel {
  organizationId: string;
  application: ApplicationName;
  theme?: ApplicationTheme;
  layout?: ISharedWhitelabelLayout;
  organization?: IOrganization;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
export interface ISharedWhitelabel {
  organizationId: string;
  primaryColor?: string;
  organization?: IOrganization;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface IWhitelabelApi {
  shared: ISharedWhitelabel;
  application: IApplicationWhitelabel;
}
export interface IUnifiedWhitelabelApi {
  theme: ApplicationTheme;
  primaryColor: string;
  layout: ISharedWhitelabelLayout;
  icon: string;
  logo: string;
}
