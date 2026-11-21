# OmniPOS roadmap

## v0.3.3 · Kitchen follow-up (implemented)

- Combine search and status with a waiting-time filter, using the same whole-minute timer as ticket badges.
- Preserve existing tickets and show a warning if refresh fails; clear the warning after a successful retry.
- Check 10/11-minute boundaries and a failed refresh with existing tickets.

## v0.4.0 · Staff accounts

- Add a staff sign-in flow instead of choosing a demo role for normal use.
- Apply tenant and role checks consistently to ordering, kitchen, stock and reporting endpoints.
- Keep the demo role switcher limited to explicit local demo mode.
- Acceptance: one store cannot read or modify another store's orders; a kitchen account cannot manage staff or stock.

## v0.5.0 · Kitchen activity history

- Store who moved a ticket through preparation, ready and served, with timestamps.
- Show a read-only activity list on a ticket and preserve old orders during the migration.
- Acceptance: repeated actions do not duplicate history, simultaneous changes do not silently overwrite each other, and staff only see their own store's history.
