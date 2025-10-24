import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable()
export class SignInApi {
  sessionInteractionKey = 'session_interaction';

  httpClient = inject(HttpClient);

  storeSession(clientId: string, session: string) {
    localStorage.setItem(
      this.sessionInteractionKey,
      JSON.stringify({ clientId, session }),
    );
  }

  getStoredSession() {
    const storedSession = localStorage.getItem(this.sessionInteractionKey);
    if (storedSession === null) {
      throw new Error('you have corromped storage.');
    }
    return JSON.parse(storedSession);
  }

  haveStoredSession() {
    const storedSession = localStorage.getItem(this.sessionInteractionKey);
    if (storedSession === null) {
      return false;
    }
    const { clientId, session } = JSON.parse(storedSession);
    if (clientId !== undefined && session !== undefined) {
      return true;
    }
    return false;
  }

  trySession() {
    const { session } = this.getStoredSession();
    return this.httpClient.get(
      environment.api + '/auth/oidc/interaction/validate/' + session,
    );
  }

  authenticate(authenticate: any) {
    const { session } = this.getStoredSession();
    return this.httpClient.post(
      environment.api + '/auth/oidc/interaction/' + session,
      authenticate,
    );
  }
}
