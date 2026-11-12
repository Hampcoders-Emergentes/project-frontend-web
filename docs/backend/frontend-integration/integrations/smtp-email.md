# Email (SMTP) — password reset and alert notifications

**Implemented, with a log-only fallback.** `EmailServiceCollectionExtensions` registers:

- `SmtpEmailSender` when `Email:Smtp:Host` is non-empty;
- otherwise **`LoggingEmailSender`**, which writes the message to the server log (full text only in Development; in other environments it logs a warning that the email *was not delivered*).

So in an environment without SMTP configuration, password-reset emails and email alerts are **never delivered**, although the API still answers `200`.

## Configuration

| Key | Default |
|---|---|
| `Email:FromAddress` | `no-reply@electrolink.local` |
| `Email:FromName` | `Electrolink` |
| `Email:Smtp:Host` / `Port` / `EnableSsl` / `Username` / `Password` / `TimeoutSeconds` | `""` / `587` / `true` / `""` / `""` / `15` |
| `PasswordReset:FrontendUrl` | `http://localhost:4200` |

## What the frontend must provide

The reset email links to **`{PasswordReset:FrontendUrl}/reset-password?token=<resetToken>`**. The web app must expose a route `/reset-password` that reads `token` from the query string and calls `POST /api/v1/auth/reset-password` with `{ resetToken, newPassword, newPasswordConfirmation }`. Token validity: 15 minutes, single use. Configure `PasswordReset__FrontendUrl` per environment.

## Other email senders

Alert notifications use the `EMAIL` channel of the store notification routes (`PUT /stores/{id}/notification-preferences`); store-manager notices (shift handover, expiring certificates) also use this sender. See [`sms-and-webhook-alerts.md`](./sms-and-webhook-alerts.md).
