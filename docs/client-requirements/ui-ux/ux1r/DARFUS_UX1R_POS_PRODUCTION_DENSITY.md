# UX-1R POS Production Density

The isolated POS reference now uses a compact three-column operational layout:

- customer and barcode/Asset search;
- three representative invoice rows with Asset identity, gold weight and stone value;
- making, discount, VAT, payment methods, remaining due and total;
- disabled checkout, loading and error states remain visible and safe.

The fixture is static/read-only. No price, tax, checkout or POS business behavior was changed.

`POS_PRODUCTION_DENSITY = PASS`
