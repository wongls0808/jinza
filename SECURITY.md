# Security Guidelines

This project avoids committing any secrets to the repository. Follow these rules:

- Never hardcode credentials (DB URLs, API keys, JWT secrets) in source files.
- Use environment variables for secrets. For local dev, prefer a .env file (ignored by .gitignore).
- Frontend config (`src/config.js`) must not contain any credentials. Only expose safe runtime values like API base path.
- In production, set at least: DATABASE_URL, JWT_SECRET, SESSION_IDLE_MS, CORS_ORIGINS, DATA_DIR.
- Disable permissive modes in production: ensure `PERM_UI_ONLY` and `AUTH_BYPASS` are not set to "1".

Server CORS
- In development, CORS is open for convenience.
- In production, restrict origins via `CORS_ORIGINS` (comma-separated list).

Initial Admin
- Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_DISPLAY` via environment variables on first boot.
- The default fallback password is only for development; never rely on it in production.

Sessions
- JWT secret should be long and random (`JWT_SECRET`). Use `SESSION_IDLE_MS` (default 30m) as needed.

Reporting
If you discover a vulnerability, please report it privately to the maintainers.
