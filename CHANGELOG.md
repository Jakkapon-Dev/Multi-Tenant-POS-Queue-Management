# Changelog

## 0.3.3 · 2026-11-21

- Filter kitchen tickets by a wait of more than ten whole minutes, combined with search and status.
- Keep existing tickets visible and show a warning when refresh fails, with a successful retry clearing it.
- Add Thai learning notes and a separate roadmap for staff accounts and activity history.

Try it: compare tickets at 10 and 11 whole minutes, combine filters, then simulate an offline refresh and retry online.

Validation: client production build; browser checks with sample API responses for filter boundaries, empty results and refresh recovery.

## 0.3.2

- Order kitchen tickets by arrival time, with oldest first as the default.
- Switch to newest first while keeping search and status filters.
- Label the chime and refresh controls for keyboard and screen-reader use.

Try sending two orders at different times, then switch Ticket order. The cards should change position while the search and status selections remain active.

## 0.3.1

- Search kitchen tickets by order number, table number, or dish name.
- Combine search with the status tabs. The board shows the matching ticket count and has a clear button.

To try it, send two different dishes to the kitchen and search for one dish or its ticket number.
