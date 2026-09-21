# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in دفتر (Daftar), please **do not** open a public GitHub issue.

Instead, report it privately:

- Preferred: open a [GitHub Security Advisory](../../security/advisories/new) for this repository.
- Alternatively, email the maintainers with details (see the repository's contact information).

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it (a minimal proof of concept helps a lot).
- The affected version/commit.

We aim to acknowledge reports within a few business days and to keep you updated as we work on a fix. Please give us reasonable time to address the issue before any public disclosure.

## Supported Versions

This project does not yet publish tagged releases; security fixes are applied to the `main` branch.

## What's already in place

For context when reviewing or reporting issues, the following protections already exist:

- **Auth**: passwords hashed with bcrypt; short-lived JWT access tokens plus rotating, hashed refresh tokens in httpOnly cookies.
- **CSRF**: double-submit cookie pattern enforced on every mutating request, including public (unauthenticated) endpoints.
- **Authorization**: every notebook-scoped route re-checks that the caller owns the notebook (or is an admin) before reading or writing it.
- **Input validation**: every request body/query/params is validated with zod before it reaches business logic.
- **File uploads**: images are sniffed for real magic bytes (not just the client-declared MIME type) and re-encoded server-side via `sharp`, which also strips embedded scripts/EXIF; non-image files are rejected.
- **User-generated content**: all message/gallery/timeline text is passed through `sanitize-html` with zero allowed tags before storage — no raw HTML or scripts are ever persisted or rendered.
- **Rate limiting**: auth endpoints and the public message-submission endpoint are rate-limited per IP (and per notebook, for messages).
- **Duplicate/spam protection**: a honeypot field and a short-window duplicate-submission check on the public write endpoint.
- **Payments**: the backend independently verifies payment status with the payment provider before activating a notebook; the frontend reporting success is never sufficient. Stripe webhooks are signature-verified.
- **Error handling**: unhandled errors return a generic message to the client; raw database/internal errors are never exposed.
- **Secrets**: all secrets are read from environment variables (see `.env.example`); none are committed or shipped to the frontend bundle.

If you find a gap in any of the above, that's exactly the kind of report we want — please follow the process above.
