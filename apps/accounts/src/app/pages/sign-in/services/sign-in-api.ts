import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
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
    console.log('authenticate', authenticate);
    let data = new HttpParams().set('session', session);

    if (authenticate.recaptcha) {
      data = data.set('recaptcha', authenticate.recaptcha);
    }
    if (authenticate.email) {
      data = data.set('email', authenticate.email);
    }
    if (authenticate.password) {
      data = data.set('password', authenticate.password);
    }
    if (authenticate.idToken) {
      data = data.set('idToken', authenticate.idToken);
    }
    if (authenticate.accessToken) {
      data = data.set('accessToken', authenticate.accessToken);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    return this.httpClient.post(
      environment.api + '/auth/oidc/interaction/login/' + session,
      data.toString(),
      { headers },
    );
  }

  verify2fa(code: string, accessToken: string) {
    const { session } = this.getStoredSession();
    const data = new HttpParams().set('code', code);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${accessToken}`,
    });
    return this.httpClient.post<{ redirectToCallback: string }>(
      environment.api + '/auth/oidc/interaction/validate2fa/' + session,
      data.toString(),
      { headers },
    );
  }
}
