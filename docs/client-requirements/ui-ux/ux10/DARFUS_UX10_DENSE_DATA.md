# UX-10 Dense / Long-Value Verification

Presentation rules were applied only beneath the Settings/Audit surface root:

- tabular numeric alignment for data tables;
- stable header alignment and vertical centering;
- local horizontal scrolling for existing overflow wrappers;
- safe wrapping and bidirectional isolation for code/identifier values;
- no change to the underlying data, query, projection, or save contract.

Static UX-10 test coverage confirms these declarations. Barcode settings rendered two existing tables and Audit rendered the existing list/detail controls during read-only inspection.
