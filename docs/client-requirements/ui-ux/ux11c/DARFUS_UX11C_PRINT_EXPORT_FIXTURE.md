# Print-Export Fixture

The existing fixture source and `tests/export-print.spec.ts` were inspected without modification. A disposable-only localized alias made the same fixture available after the application's locale redirect; the underlying fixture markup and test assertions were unchanged. The fixture rendered one root with 14 expected template instances (Luxury 5, Compact 3, Minimal 3, Thermal 3).

`PRINT_EXPORT_FIXTURE_AVAILABLE_IN_DISPOSABLE = YES`; `PRODUCTION_FIXTURE_ROUTE_ADDED = NO`.
