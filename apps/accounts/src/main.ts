import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { setUrbisConfig } from '@open-urbis/map-ui';
import { environment } from './environments/environment';

setUrbisConfig({
  apiUrl: environment.api,
  recaptchaSiteKey: environment.googleRecaptchaSiteKey,
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
