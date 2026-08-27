# Tables Audit

Source uses `table-wrap`, native tables and reusable toolbar patterns. Runtime proof showed tables on Inventory, Invoices Search & Print, Treasury, Gold Center history, Barcode Code Settings, Approvals and Inventory Valuation. Most provide filters, read-only status, and pagination where relevant.

Risks: tables are often rendered as wide desktop grids with responsive degradation relying on horizontal containers; column grouping/sticky headers are not universal; some page results use card/list projections instead of semantic `<table>`. Numeric alignment is globally centered (`app/globals.css`), which is consistent but not ideal for financial comparison. Classification P1/P2 depending on accounting/inventory criticality. No table mutation occurred.
