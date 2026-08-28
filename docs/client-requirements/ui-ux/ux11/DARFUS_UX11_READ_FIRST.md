# UX-11 Read-First Record

## Arabic summary

تمت قراءة تعليمات UX-11 بالكامل قبل أي تعديل. هذا السجل يثبت أن النطاق يقتصر على عرض ومعاينة وطباعة المستندات، مع تجميد هوية المستندات والبيانات والضرائب والمخزون والمحاسبة والصلاحيات ومسارات إعادة الطباعة التجارية.

## Authority order

1. Current Owner/Product decisions and closed UX gates.
2. Current source and runtime implementation.
3. Existing reports as supporting evidence only.

`DARFUS_OWNER_MASTER_WORKING_METHOD_AND_PROMPT_CONTRACT.md` was searched for in the workspace and was not present. It is recorded as a missing read-first artifact; no authority was inferred from its absence.

## Closed/current context

- UX-10 Settings/Audit: closed by its current report with PASS gate.
- UX-11: current authorized track.
- Gift Voucher financial mapping prevention item: remains open.
- CGP repeated-print recovery item `CGP-PRINT-RECOVERY-UI-001`: remains open unless separately proven.
- Inventory Count: remains closed and is not reopened.

## Required safety boundary

The implementation may change presentation-only classes and print CSS isolation. It must not change document identifiers, totals, tax, inventory, asset/barcode/QR payloads, payment, accounting, permissions, routes, or server print/reprint authority.

## Source and runtime observations

The current source has a shared print renderer (`renderPrintDocument`), shared print CSS (`lib/print/print-config.ts`), invoice templates selected by `InvoiceDocument`, receipt preview, barcode preview, and Asset tag preview. Server-authorized print/reprint calls exist in invoice search and Gift Voucher surfaces; those actions were not invoked.

## Mutation policy

No business POST/PUT/PATCH/DELETE is part of UX-11 proof. The official database is not to be written. No secrets, cookies, or credentials are collected.

