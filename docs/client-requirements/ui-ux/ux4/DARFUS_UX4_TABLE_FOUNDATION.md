# UX4 Table Foundation

Added presentation-only `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell` primitives. They preserve native table semantics, scoped column headers, numeric-friendly className passthrough, table-wrap horizontal overflow, and stable header/row surface tokens. Existing module tables were not rewritten and no sorting/filtering/query behavior changed.

Result: `TABLE_FOUNDATION = PASS` by source and focused tests.
