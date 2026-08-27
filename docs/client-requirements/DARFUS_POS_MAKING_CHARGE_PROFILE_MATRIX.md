# DARFUS POS Making Charge — Profile Matrix

بالعربي: هذه المصفوفة تفصل صيغة Gold By Weight عن الاستراتيجيات الأخرى حتى لا تنتقل قاعدة الوزن إلى ملف غير معني بها.

| Profile | Physical/weight source | Making basis | Pricing authority | VAT/accounting boundary | Status in this control |
|---|---|---|---|---|---|
| `GOLD_BY_WEIGHT_JEWELLERY` | Serialized Asset; `netGoldWeight` is eligible gold weight; `grossWeight` remains display/audit | `netGoldWeight × makingChargePerGram` | `goldSalePricingService.calculateGoldSalePriceForAsset` and `calculateGoldByWeightSalePrice` | VAT once on GBW subtotal; existing journal/COGS authority reused | Corrected and focused-tested |
| `GOLD_BY_PIECE` | Serialized Asset/current cost authority | No GBW weight formula; current cost + configured markup | `calculateGoldByPieceSalePrice` | Existing profile VAT/accounting boundary | Preserved; no GBW change |
| `GOLD_BAR_24K` | Serialized Asset/net gold weight for gold value | Certificate charge strategy, not GBW making | `calculateGoldBar24KSalePrice` | VAT semantics remain certificate-only per current authority | Preserved; no GBW change |
| `DIAMOND_JEWELLERY` | Serialized Asset/current profile pricing | No GBW making formula | Loose/profile pricing authority | Existing tax/accounting boundary | Preserved; no Diamond change |
| `LOOSE_DIAMOND` | Serialized Asset/current profile pricing | No GBW making formula | Loose profile sale pricing | Existing tax/accounting boundary | Preserved |
| `GEMSTONE_JEWELLERY` | Serialized Asset/current profile pricing | No GBW making formula | Loose/profile pricing authority | Existing tax/accounting boundary | Preserved |
| `LOOSE_GEMSTONE` | Serialized Asset/current profile pricing | No GBW making formula | Loose profile pricing authority | Existing tax/accounting boundary | Preserved |
| `PEARL_JEWELLERY` | Serialized Asset/current profile pricing | No GBW making formula | Loose/profile pricing authority | Existing tax/accounting boundary | Preserved |
| `LOOSE_PEARL` | Serialized Asset/current profile pricing | No GBW making formula | Loose profile pricing authority | Existing tax/accounting boundary | Preserved |
| `CGP_CUSTOMER_GOLD_PURCHASE` | Separate CGP acquisition authority; sale profile naming remains explicit | Not converted into GBW purchase/acquisition logic | Existing CGP/service boundary | Existing CGP accounting/tax authority | Preserved; no CGP acquisition change |

## Multi-item contract

For a multi-item sale, the canonical economic shape is:

```text
lineMaking_i = eligibleWeight_i × validatedRate_i
invoiceMaking = Σ lineMaking_i
invoiceSubtotal = Σ lineSubtotal_i − approved discounts
invoiceVAT = canonical tax engine(invoice tax base)
```

The accepted POS UI currently exposes one cart-level `makingChargePerGram`, so all GBW lines in that cart receive the same validated rate. This control does not add a new per-line editor. The service-level varying-rate proof is covered by MC-03; a future separate requirement for multiple UI rates would need its own scope and acceptance.

## Profile-specific invariants

| Invariant | GBW | GBP/bar/loose/CGP |
|---|---:|---:|
| Net weight is GBW making basis | YES | NOT APPLICABLE |
| Gross weight remains physical/display data | YES | Existing profile-specific behavior |
| Product quantity is physical authority | NO | NO for serialized Asset profiles |
| Client price is final authority | NO | NO |
| Server Gold Center rate required | YES for dynamic gold sale | Only where existing strategy requires it |
| Minimum making manager approval | YES when configured | Not imported from GBW |
| New VAT resolver | NO | NO |
| Accounting rewrite | NO | NO |

## Deferred boundary

- Official policy rows currently have `selling_making_per_gram=NULL` and `minimum_making_per_gram=NULL`; this is a configuration/readiness fact, not permission to seed data in this control.
- The legacy `/gold/quote` path remains gross-based and is documented as a foundation path not wired to the current POS. It was not broadened or silently reclassified.

