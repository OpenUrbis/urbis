import { bootstrapApplication } from '@angular/platform-browser';
import { initPostHog } from '@open-urbis/map-shared';
import { appConfig } from './app/app.config';
import { App } from './app/app';

initPostHog({ appName: 'Urbis Accounts' });

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
