# UX-6 Data Density

- List table uses a bounded `overflow-x-auto` wrapper and `min-w-[980px]`, preventing destructive column compression while keeping horizontal overflow local to the table.
- Header is sticky within the existing scroll surface and uses a translucent backdrop for scanability.
- Cells use consistent vertical padding; IDs, Barcodes, weights, totals, and ranges use `tabular-nums`/LTR rendering where appropriate.
- The after browser list rendered 16 populated Asset rows in the current branch context.
- Mobile browser metrics showed no body-level horizontal overflow; the table itself remains the only scrollable wide surface.

