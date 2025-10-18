# Changelog

## v1.8.1 (2025-10-18)

UI/i18n improvements and editor configuration tweaks.

### Frontend
- i18n sweep continued: Banks placeholders for code/zh/en names; common keys added (csv/pdf/input).
- FXPayments and FXSettlements: replaced hardcoded CSV/PDF labels with i18n.
- Workbench: quick actions and drawers now fully localized; date filter Apply uses i18n.
- UserManagement: admin-all-permissions notice localized via users.adminAllPermsNotice.
- Removed legacy backup views `TransactionsView_backup_import.vue` and `TransactionsView_clean.vue`.

### Tooling
- jsconfig.json narrowed include/exclude to stabilize Vue language service and avoid false diagnostics.

### Build
- No functional backend changes. Vite build verified OK.

## v1.8.0 (2025-10-18)

Stabilization and feature completeness release.

### Highlights
- BuyFX matching fixed with single-connection transactions, currency normalization, and platform_delta_applied guard.
- Resolved PostgreSQL lock error by using `FOR UPDATE OF t` on outer-joined select.
- Batch delete: permission broadened and SQL corrected to `DELETE WHERE id = ANY($1::int[])` with server-side sanitation.
- Transactions listing and stats hardened: pagination bounds, sort whitelist, numeric filter validation, and by-type debit/credit mapping.
- Robust error propagation to frontend; UI now surfaces per-item match failures with details.

### Backend
- Add withTransaction/queryWithClient helpers to ensure all statements share one connection.
- Ensure FX and transactions DDL on-demand (self-healing columns and indexes).
- Match/Unmatch routes are transactional and rollback platform balances safely.
- GET /transactions/:id added for inspection/debugging.
- Route param constraints avoid capturing static routes.

### Frontend
- Unified fetch handling to avoid double-reading body; improved 401 redirect handling.
- Transactions views show per-item failure reasons for batch operations.
- Stats and Workbench dashboards aligned with new mappings and filters.

### Misc
- Build artifacts include version file with commit SHA and time.

