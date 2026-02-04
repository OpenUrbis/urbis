# Accounts

Urbis Accounts handles user authentication and profile management.

## Local Development with SSL

For full functionality (including OIDC/OAuth callbacks), it is recommended to run the Accounts app with SSL locally using the custom domain `conta.urbis.prefeitura.sp.gov.br`.

### Prerequisites

1.  **SSL Certificates**: You must have `conta.urbis.prefeitura.sp.gov.br.pem` and `conta.urbis.prefeitura.sp.gov.br-key.pem` in the root of `apps/accounts`.
2.  **Hosts File**: Add the following entry to your `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
    ```
    127.0.0.1 conta.urbis.prefeitura.sp.gov.br
    ```

### Running with SSL

To start the Angular development server and the SSL proxy/redirect server simultaneously:

```bash
pnpm dev:ssl
```

This will:
*   Start the Angular dev server on `http://localhost:4200`.
*   Start a secure proxy server on `https://conta.urbis.prefeitura.sp.gov.br` (port 443).

> **Note**: Since it binds to port 443, you may be prompted for your administrator password.

## Production Build

To create a production build:

```bash
pnpm build:prod
```

The output will be available in `dist/accounts/browser`.
