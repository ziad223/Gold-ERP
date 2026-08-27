# DARFUS CLIENT C4 — Minimum Safe Tag Rendering Boundary

Control: `DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01`

## Target boundary

`TARGET_REQUIREMENTS = BC-038, BC-039, BC-040, BC-041, BC-042, BC-030, BC-035(tag subset)`

`EXACT_GAP =` the shared client tag components exist, but the renderer currently includes profile rows not present in the client tag contract (Diamond `Cut`/`Cert`, Gem Stone `Cert`, Pearl `Size`/`Quality`), has no explicit profile-contract projection, and the shared client renderer is not visibly connected to the Asset detail print/preview surface.

`ROOT_CAUSE =` presentation projection was implemented as independent per-profile JSX rows without a frozen field contract; the generic label path and the client front/back path are not clearly separated at the user-facing Asset detail surface.

`FILES_EXPECTED_TO_CHANGE =`

- `features/printing/components/barcode-tags/types.ts`
- `features/printing/components/barcode-tags/BarcodeTagBacks.tsx`
- `features/printing/components/barcode-tags/BarcodeTagFront.tsx` only if required to remove non-contract tag extras
- `features/printing/components/ClientBarcodeTagTemplate.tsx` only if required for the shared contract
- `lib/print/barcode-label.ts` only if required for the read-only profile mapping
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx` only to expose the existing read-only shared tag preview/print action
- one focused C4 test file
- the six C4 evidence artifacts

`FILES_FORBIDDEN_TO_CHANGE =` barcode identity service, barcode migrations, Asset model/schema, RFID routes/service, receive/POS/CGP/accounting routes, status/revision services, master data, configuration, official `.env`, `next-env.d.ts`, unrelated profile business services, and production.

`DB_SCHEMA_CHANGE_EXPECTED = NO`

`BUSINESS_LOGIC_CHANGE_EXPECTED = NO`

`ACCOUNTING_IMPACT = NONE`

`INVENTORY_IMPACT = READ-ONLY TAG CONSUMPTION; no Asset/Barcode/Movement mutation`

`SECURITY_IMPACT = preserve existing inventory.view and inventory.print permissions; no new permission`

`IDEMPOTENCY_IMPACT = none for client-only print preview; existing backend tag-print idempotency route remains untouched`

## Stop conditions

Stop C4 if a required field cannot be mapped to an existing authority, if price/valuation authority is ambiguous, if a new SKU/image owner is required, if Barcode/RFID coupling is needed, or if a printer-specific dimension must be invented. Those cases are Owner Decision / blocked evidence, not implementation opportunities.

