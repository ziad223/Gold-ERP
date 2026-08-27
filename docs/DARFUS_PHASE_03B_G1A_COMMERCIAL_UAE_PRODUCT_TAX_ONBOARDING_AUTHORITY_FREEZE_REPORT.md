# DARFUS ERP — Phase 03B-G1A Commercial UAE Product + Tax Policy + Onboarding Authority Freeze

Control ID: DARFUS-PHASE-03B-G1A-COMMERCIAL-UAE-PRODUCT-TAX-ONBOARDING-AUTHORITY-FREEZE  
Phase: 03B-G1A  
Mode: READ_ONLY_PRODUCT_AND_UAE_TAX_AUTHORITY_FREEZE  
Official DB: darfus_erp — READ ONLY  
Audit date: 2026-08-18

## 1. Executive Summary

تم تثبيت تصميم DARFUS كمنتج Commercial ERP موجه للشركات في الإمارات، وليس كنظام مربوط ببيانات شركة المالك. لا يحتاج التطوير أو القبول إلى TRN حقيقي أو Supplier حقيقي أو Location حقيقي أو إعداد VAT إنتاجي حقيقي.

تمت مراجعة المصادر الرسمية الحالية لهيئة Federal Tax Authority ووزارة المالية الإماراتية، بما فيها VATP043. النتيجة القانونية المهمة:

- معدل VAT القياسي في الإمارات 5%.
- Zero-rated هو taxable supply بمعدل 0%، وليس نفس Exempt.
- Exempt ليس taxable supply، وله أثر مختلف على Input Tax recovery.
- VATP043 يحل محل VATP032، وقرار Cabinet Decision No. 127 of 2024 نافذ من 26 فبراير 2025.
- RCM للسلع الثمينة ليس اختيارًا من المتصفح؛ يلزم تحقق Server من نوع السلعة وقيمة المكونات وحالة التسجيل والنية والتصاريح والتحقق لدى المورد والتاريخ القانوني.
- يشمل RCM الحالي الذهب والفضة والبلاديوم والبلاتين، والألماس الطبيعي/المصنّع واللؤلؤ والياقوت والزفير والزمرد، والمجوهرات المصنوعة منها، عندما تكون قيمة المعادن/الأحجار أعلى من المكونات الأخرى وتتحقق الشروط.
- Making service لا يدخل RCM تلقائيًا؛ يعامل مع السلعة فقط إذا كان جزءًا من Single Composite Supply، أما Multiple Supplies فتُعامل مكوناتها منفصلة.

تم فصل السلطات إلى:

UAE Tax Engine → Company Tax Policy → Transaction Tax Context → Server Legal Eligibility → Immutable Tax Snapshot → Accounting.

الـGate يمر كـAuthority Freeze Design؛ ولا يعني تنفيذًا أو إعدادًا إنتاجيًا. أي تطبيق لاحق يجب أن يمر بـTax Professional/Owner review للوقائع الخاصة بالشركة ولـAccounting mapping.

## 2. Owner Product Decisions

| Decision | Frozen value |
|---|---|
| Product type | COMMERCIAL_ERP_PRODUCT |
| Product binding | PRODUCT_NOT_BOUND_TO_OWNER_COMPANY |
| Jurisdiction | UAE_ONLY |
| Company tax policy | YES |
| Real owner data during development | NO |
| Development and acceptance data | SYNTHETIC_DEMO_TEST_DATA_ONLY |
| Production data entry | Authorized end-customer users |
| Fake production defaults | FORBIDDEN |
| Supplier | Customer-owned, company-scoped master data |
| Location | Customer-owned, branch-scoped DB master data |
| RCM | Company policy may enable capability; Server UAE Tax Engine decides legal eligibility |
| Next batch | NO_AUTOMATIC_START |

## 3. Preconditions

| Requirement | Expected | Actual | Evidence | Status |
|---|---|---|---|---|
| PHASE_03A_FINAL_CLOSED | YES | YES | R5 final acceptance report | PASS |
| Previous G1 gate | BLOCKED_PHASE_03B_G1_OWNER_DECISION_REQUIRED | Matched | G1 design report | PASS |
| VAT_REGISTERED authority defined | YES | YES, as G1 design | G1 recommended companies.vat_registered design | PASS |
| Location canonical management defined | YES | YES, design only | G1 Location design | PASS |
| Production configuration applied | NO | NO | 03B final tokens | PASS |
| Real receive allowed | NO | NO | 03B final tokens | PASS |

The previous G1 result is treated as a design block, not as a failed implementation.

## 4. Official UAE Tax Sources Reviewed

Only official UAE primary or official FTA/MoF sources were used. No blog, commercial summary, forum, AI summary, or SEO source was used as legal authority.

| Official source | Use in this freeze |
|---|---|
| [FTA VATP043 page](https://tax.gov.ae/en/content/application.of.the.reverse.charge.mechanism.on.precious.metals.and.precious.stones.between.registrants.in.the.state.for.the.purposes.of.value.added.tax.aspx) | Current public clarification entry |
| [FTA VATP043 PDF, 1 May 2025](https://tax.gov.ae/Datafolder/Files/Pdf/2025/VATP043-Precious-Metals-and-Precious-Stones-01-05-2025.pdf) | Precious-Goods RCM scope, conditions, effective date, composite/multiple supplies, non-retrospective behavior |
| [FTA VAT Registration](https://tax.gov.ae/en/taxes/Vat/vat.topics/registration.for.vat.aspx) | Registrant concept and thresholds |
| [FTA What Is A Taxable Supply](https://tax.gov.ae/en/search/genericcontent/what.is.a.taxable.supply.aspx) | Taxable supply definition for 5%/0% |
| [FTA Taxable Person VAT Guide](https://tax.gov.ae/DataFolder/Files/Pdf/Taxable-Person-Guide-June-2018.pdf) | Standard/zero/exempt distinctions and input-tax implications |
| [FTA Financial Services VAT Guide](https://tax.gov.ae/DownloadOpenTextFile?fileUrl=en%2FVAT_VAT_Guides%2FFinancial_Services_VAT_Guide%2FFinancial_Services_VAT_Guide_VATGFS1_EN_07_2019_EN.pdf) | Investment-grade precious metals and recovery distinction |
| [UAE Federal Decree-Law No. 8 of 2017](https://www.uaelegislation.gov.ae/en/legislations/1227) | Federal VAT legal text reference |
| [Executive Regulation reference](https://tax.gov.ae/ftatacsoft5cms/DataFolder/Files/Legislation/Executive%20Regulation%20of%20Federal%20Decree%20Law%20No%208%20of%202017%20-%20Publish%20new.pdf) | Article 36 investment precious metals and Article 4/46 composite/multiple supply references |
| [MoF UAE eInvoicing portal](https://mof.gov.ae/en/about-us/initiatives/einvoicing/) | Current official e-invoicing boundary |
| [MoF eInvoicing rollout announcement](https://mof.gov.ae/en/news/ministry-of-finance-announces-the-issuance-of-two-ministerial-decisions-on-the-scope-of-obligations-and-the-timelines-for-implementing-the-electronic-invoicing-system-2/) | Future compliance timeline/context |

## 5. Current UAE VAT Authority

### Official facts

- The FTA registration page states mandatory registration at taxable supplies/imports above AED 375,000 and voluntary registration above AED 187,500 subject to the stated conditions.
- The FTA taxable-supply page defines taxable supplies for registration purposes as UAE business supplies that may be taxed at 5% or 0%.
- The FTA VAT guide distinguishes standard rate 5%, zero rate 0%, and exempt supplies.
- Zero-rated supplies remain taxable supplies and generally preserve input-tax recovery subject to the normal conditions.
- Exempt supplies are not taxable supplies and input tax attributable to exempt supplies is generally not recoverable, subject to the applicable apportionment/legal rules.
- A TRN/registration status is evidence of a registrant state; the product must store it as customer policy/data and never infer it from a TRN string alone.

### Product consequence

The product must represent:

UAE Tax Engine legal semantics  
→ Company VAT policy and registration evidence  
→ Transaction legal context  
→ Server resolution and snapshot.

The existing source fallback vatRate=5 is classified as a System Safe Runtime Fallback, not as a customer-approved production configuration.

## 6. Precious-Goods RCM Authority

### Current official authority

FTA VATP043 states that it replaces VATP032. The clarification records Cabinet Decision No. 127 of 2024 and its effective date of 26 February 2025.

VATP043 covers Precious Goods comprising:

- Gold, silver, palladium, and platinum.
- Natural and manufactured/synthetic diamonds, pearls, rubies, sapphires, and emeralds.
- Jewellery made from any of those precious metals/stones or a combination.
- The value of the precious metals/stones must be higher than the value of other components.

All required conditions must be considered:

- Recipient is VAT registered in the UAE.
- Recipient intends to resell the goods or use them to produce/manufacture Precious Goods.
- Recipient supplies written declarations before supply.
- Supplier receives and retains those declarations.
- Supplier verifies the recipient registration through FTA-approved means.
- RCM does not apply when the supply is zero-rated under Article 45(1).

### Effective and historical behavior

The amended Precious-Goods RCM does not apply retrospectively. VATP043 states that supplies before 26 February 2025 are not retroactively converted under the amended mechanism and have no special transitional rule.

### Current source relationship

The current DARFUS source has an RCM branch and snapshots isRcm/rcmRate/rcmVatAmount, but it does not yet have a UAE legal eligibility engine, declaration/evidence model, rule version, or precise Precious-Goods composition/value test. Therefore the browser checkbox cannot be the authority.

## 7. Jewellery-Specific Legal Findings

| Finding | Authority classification | Product implication |
|---|---|---|
| Gold is a specified precious metal | OFFICIAL_UAE_RULE | RCM potential, not automatic RCM |
| Silver/palladium/platinum are specified | OFFICIAL_UAE_RULE | RCM potential where all conditions hold |
| Diamond/pearl/ruby/sapphire/emerald are specified stones | OFFICIAL_UAE_RULE | RCM potential where all conditions hold |
| Jewellery made from specified goods can be Precious Goods | OFFICIAL_UAE_RULE | Requires value-of-precious-goods-over-other-components test |
| 24K label alone | TRANSACTION_FACT_REQUIRED | Does not by itself prove investment-grade bullion form or RCM eligibility |
| Jewellery label alone | TRANSACTION_FACT_REQUIRED | Does not automatically establish RCM |
| Making charge/service | OFFICIAL_UAE_RULE | RCM only when part of qualifying single composite supply; separate service is not automatically RCM |
| Export | OFFICIAL_UAE_RULE | May be zero-rated if legal export conditions hold; zero-rated supply is excluded from VATP043 RCM |
| Investment precious metal | OFFICIAL_UAE_RULE | Potential zero-rating when Article 36 criteria are met; not assumed from profile name |

## 8. Product Architecture Freeze

The frozen product architecture is:

UAE Tax Engine  
→ Company Tax Policy  
→ Transaction Tax Context  
→ Server Legal Eligibility + Calculation  
→ Immutable Tax Snapshot  
→ Accounting Posting.

The system is UAE-only for this product configuration. Company policy can enable/disable operational treatments and collect evidence requirements, but cannot redefine UAE law or grant legal eligibility.

## 9. UAE Tax Engine Authority

The Tax Engine is system-owned and must provide:

- UAE jurisdiction and legal-rule identifiers.
- Standard/zero/exempt/out-of-scope semantics.
- VATP043 Precious-Goods classification and eligibility rules.
- Effective date evaluation.
- Recipient and supplier registration evidence requirements.
- Resale/production/manufacturing intent.
- Precious-metal/stone composition and value comparison.
- Zero-rated exclusion from the special Precious-Goods RCM.
- Making-service composite versus multiple-supply resolution.
- Historical rule version and effective date in snapshots.

Company users may not edit these legal semantics. A tax engine result must include a rule identifier/version and a reason code.

## 10. Company Tax Policy Authority

Company-scoped policy may contain, subject to future approved implementation:

| Policy | Meaning |
|---|---|
| taxJurisdiction | UAE only in this product |
| vatRegistered | NULL/YES/NO customer value; no inference |
| trn | Customer-entered TRN or N/A |
| vatRate | Persisted approved rate; current UAE standard legal rate is 5% but no customer setting is applied here |
| enabledTaxTreatments | Operational allow-list, not legal eligibility |
| defaultTaxTreatment | Optional/nullable preference; never overrides legal eligibility |
| taxIncludedPreference | Company preference only where valid |
| inputTax/recoverability policy | Only within legal/accounting limits; not a universal boolean authority |
| tax account mappings | Company financial configuration |
| preciousGoodsRcmEnabled | Operational capability flag only; never an eligibility override |

No values are configured in this control.

## 11. Transaction Tax Context Authority

Every future transaction must record a resolved context including, where applicable:

- treatment identifier;
- legal rule/version/effective date;
- company policy version or relevant policy snapshot;
- supply date;
- calculated rate;
- tax base and amount;
- registration snapshots;
- supplier verification/declaration evidence reference;
- recipient resale/production intent;
- Precious-Goods classification and value/composition result;
- composite/multiple-supply structure;
- making-service treatment;
- reason codes and authority actor.

The client may request a treatment, but Server validates policy and legal eligibility, calculates amounts, and writes the immutable snapshot. Client VAT amount and RCM checkbox are not authority.

## 12. STANDARD_VAT

### Official meaning

Standard-rated taxable supplies are charged at the UAE standard rate of 5% unless another legally applicable treatment applies.

### Product design

- Rate authority: persisted Company/Settings policy, constrained by UAE Tax Engine; current source fallback 5 is not production configuration.
- Registration prerequisite: legal registration obligations depend on taxable supplies/imports and official thresholds; transaction use of VAT collection/recovery must be governed by Company policy and legal context. Do not infer from TRN.
- Tax-included support: a company preference may be supported where valid; server derives the tax base and amount.
- Recoverability: not a universal company toggle; input-tax recovery is governed by legal use and applicable recovery/apportionment rules.
- Snapshot: treatment, rate, base, amount, policy/rule version, recoverability result.
- Posting: use the existing ordinary VAT posting path only after the server resolves the treatment and configured accounts.

## 13. ZERO_RATED

### Official meaning

Zero-rated is a taxable supply at 0%, not a generic no-VAT switch. FTA material identifies qualifying exports and certain investment precious metals as examples. The legal reason and evidence must be recorded.

### Product design

- Rate is 0 only after a legal reason is validated.
- Investment precious metal requires the official criteria, including the Article 36 purity/form conditions; Gold By Weight, Gold By Piece, or Gold Bar profile names alone do not prove it.
- Export requires the applicable export evidence and conditions.
- VATP043 special Precious-Goods RCM does not apply where the supply is zero-rated under Article 45(1).
- Input-tax recovery remains a separate legal result and must not be switched off merely because output VAT is 0.
- Snapshot stores zero-rate reason, evidence reference, rule version, and recovery result.
- Current accounting source has a no-VAT branch but no explicit zero-rated treatment mapping; future implementation must add the treatment context without guessing account policy.

## 14. REVERSE_CHARGE

### Official meaning

For the relevant Precious Goods, RCM can apply only when the VATP043 conditions and effective-date rules are satisfied. The supplier does not account for the tax on the qualifying Goods supply; the recipient accounts for due tax.

### Server eligibility result

The Tax Engine should return exactly one of:

- RCM_ELIGIBLE
- RCM_NOT_ELIGIBLE
- RCM_EVIDENCE_REQUIRED

Eligibility must evaluate:

- recipient VAT registration;
- supplier registration/verification evidence;
- written declaration before supply;
- resale or production/manufacturing intent;
- specified precious metal/stone;
- value of precious goods greater than other components;
- supply date and rule version;
- zero-rated exclusion;
- composite/multiple supply;
- separate making service treatment.

### Snapshot

Record the legal rule/version, effective date, qualification reason, recipient registration snapshot, evidence reference, intent, classification, component structure, and resolved posting treatment. Do not store secrets.

## 15. EXEMPT

### Official meaning

Exempt supplies are not taxable supplies. FTA guidance distinguishes them from zero-rated supplies and explains that input tax attributable to exempt supplies is generally not recoverable, subject to applicable apportionment/legal rules.

### Product design

- Exempt is a legal outcome supported by the Tax Engine, not a user-defined no-VAT switch.
- Jewellery inventory is not assumed exempt merely because it is jewellery or precious.
- Company policy may enable the category for workflows, but only the Tax Engine and transaction facts can qualify a transaction.
- Snapshot stores the legal reason/rule version and recovery result.
- Current source does not prove a dedicated exempt posting branch; future accounting mapping must be approved rather than copied from the no-VAT branch.

## 16. OUT_OF_SCOPE

### Official meaning

Out-of-scope is a jurisdiction/scope result, not a generic no-VAT button. It requires a legal reason and transaction evidence. Designated Zone treatment must only be used where current official UAE authority supports the exact case.

### Product design

- No output VAT amount is calculated for an out-of-scope result.
- Out-of-scope must not be selected to bypass UAE VAT.
- Company policy may expose the workflow capability, but cannot create out-of-scope status.
- Snapshot stores scope reason, jurisdiction facts, rule version, and evidence.
- Current source has no dedicated out-of-scope posting mapping; accounting treatment is future approved policy, not an invented default.

## 17. Making Charges / Composite vs Multiple Supply

FTA VATP043 explains:

- A supply with multiple components for one price must be assessed as single composite or multiple supplies.
- Composite supply follows the treatment of its principal component.
- Composite treatment requires the components not to be separately priced/charged and to be supplied by one supplier, with the wider contractual circumstances considered.
- If not a composite supply, each component is treated as a separate supply.
- Making/manufacturing services are not included in the special Precious-Goods RCM unless they form part of the qualifying single composite supply.
- In multiple supplies, only the qualifying Precious Goods may use the special RCM; related making services are taxed under their applicable normal VAT treatment.

This is directly relevant to GBW, GBP, Diamond Jewellery, Gem Jewellery, and Pearl Jewellery. No making formula or product pricing rule is changed in G1A.

## 18. Previous G1 Decisions Resolved

| Previous G1 block | G1A resolution |
|---|---|
| VAT_REGISTERED authority absent | Keep G1 recommendation companies.vat_registered as nullable Company authority; customer data, no inference |
| Tax treatment not one enum | Keep five canonical identifiers and add UAE legal eligibility context; browser selection is not enough |
| RCM was a checkbox | Replace conceptually with Company capability plus server VATP043 eligibility result |
| Zero/exempt/out-of-scope were ambiguous | Define legal distinctions and evidence requirements; no generic no-VAT behavior |
| Location authority | Remains customer-owned, branch-scoped DB master data; no fake default |
| Supplier/Location values during development | Real customer values not required; synthetic-only test scope |
| Production readiness | Separate System First-Run READY from Operational Receive READY |

## 19. Tax Matrix

Each cell is explicitly classified as OFFICIAL_UAE_RULE, CURRENT_SOURCE_BEHAVIOR, COMPANY_POLICY, TRANSACTION_FACT, NOT_APPLICABLE, or UNRESOLVED.

| Treatment | UAE engine supports? | Company may enable? | Transaction eligibility source | Rate authority | Input-tax behavior | Supplier payable behavior | Posting behavior | Required evidence |
|---|---|---|---|---|---|---|---|---|
| STANDARD_VAT | YES (OFFICIAL_UAE_RULE) | YES as capability, not legal override (COMPANY_POLICY) | Taxable supply and transaction facts (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | Persisted approved Company policy constrained by UAE rate (COMPANY_POLICY + OFFICIAL_UAE_RULE) | General legal recovery/apportionment result (OFFICIAL_UAE_RULE) | Supplier payable includes resolved VAT where supplier charges it (CURRENT_SOURCE_BEHAVIOR pending treatment context) | Existing ordinary VAT branch after server resolution (CURRENT_SOURCE_BEHAVIOR) | Supply facts, policy/rule version, tax snapshot (TRANSACTION_FACT) |
| ZERO_RATED | YES (OFFICIAL_UAE_RULE) | YES as capability, not legal override (COMPANY_POLICY) | Legal zero-rate reason such as qualifying export/investment metal (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | 0% only after reason validation (OFFICIAL_UAE_RULE) | Taxable zero-rated supply generally retains recovery subject to law (OFFICIAL_UAE_RULE) | No output VAT charged; commercial payable follows supply amount (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | No VAT line at 0%; dedicated treatment mapping required (CURRENT_SOURCE_BEHAVIOR + UNRESOLVED_ACCOUNT_POLICY) | Export/investment evidence and rule version (TRANSACTION_FACT) |
| REVERSE_CHARGE | YES (OFFICIAL_UAE_RULE) | YES operationally, never as eligibility override (COMPANY_POLICY) | VATP043 conditions, date, goods/value/composition, registration, intent, declarations, verification (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | Recipient accounts for due VAT on Goods (OFFICIAL_UAE_RULE; configured rate calculation) | Recipient recovery follows general rules; not automatic (OFFICIAL_UAE_RULE) | Supplier does not charge/account VAT on qualifying Goods; payable excludes supplier VAT (OFFICIAL_UAE_RULE) | Existing RCM branch: input VAT debit + RCM output VAT credit, inventory/payable on tax base (CURRENT_SOURCE_BEHAVIOR) | Declarations, verification, registration snapshots, intent, Goods classification, rule version (TRANSACTION_FACT) |
| EXEMPT | YES as legal category (OFFICIAL_UAE_RULE) | YES as capability only (COMPANY_POLICY) | FTA legal exempt category and transaction facts (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | Not applicable; no VAT charged (OFFICIAL_UAE_RULE) | Generally not recoverable when attributable to exempt supplies, subject to law/apportionment (OFFICIAL_UAE_RULE) | No output VAT; payable follows commercial amount (OFFICIAL_UAE_RULE) | No dedicated current treatment branch; approved mapping required (UNRESOLVED) | Legal exempt reason and rule version (TRANSACTION_FACT) |
| OUT_OF_SCOPE | YES as scope outcome (OFFICIAL_UAE_RULE) | Capability label only; cannot override law (COMPANY_POLICY) | Jurisdiction/place/supply facts and approved legal reason (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | Not applicable (OFFICIAL_UAE_RULE) | Depends on use and applicable law; not inferred (UNRESOLVED) | No UAE output VAT; commercial payable follows facts (TRANSACTION_FACT) | No dedicated current treatment branch; approved mapping required (UNRESOLVED) | Scope reason, jurisdiction facts, evidence, rule version (TRANSACTION_FACT) |

NO_GUESSED_ACCOUNTING_MAPPING = YES. The unresolved cells are explicitly blocked from automatic implementation.

## 20. Jewellery Profile Applicability Matrix

Potential applicability only. None of these rows authorizes automatic treatment.

| Profile | STANDARD_VAT | ZERO_RATED | PRECIOUS_GOODS_RCM | OUT_OF_SCOPE |
|---|---|---|---|---|
| GBW | Potential for UAE taxable supply (TRANSACTION_FACT) | Only qualifying export/investment-metal legal facts (OFFICIAL_UAE_RULE) | Potential if covered goods, value test, registration, intent, evidence, date all hold (OFFICIAL_UAE_RULE) | Only verified jurisdiction/scope fact (TRANSACTION_FACT) |
| GBP | Potential for UAE taxable supply (TRANSACTION_FACT) | Not from profile name; only qualifying legal facts (OFFICIAL_UAE_RULE) | Potential for qualifying gold goods/jewellery and full VATP043 facts (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Gold Bar 24K | Potential standard supply (TRANSACTION_FACT) | Only if investment-grade purity/form criteria are proven (OFFICIAL_UAE_RULE) | Potential if VATP043 goods/conditions hold; 24K label alone is insufficient (OFFICIAL_UAE_RULE + TRANSACTION_FACT) | Only verified scope fact (TRANSACTION_FACT) |
| Diamond Jewellery | Potential standard supply (TRANSACTION_FACT) | Only legal export/other qualifying basis; not general jewellery (OFFICIAL_UAE_RULE) | Potential if specified diamond goods and precious value exceeds other components, plus all conditions (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Loose Diamond | Potential standard supply (TRANSACTION_FACT) | Only legal reason/evidence (OFFICIAL_UAE_RULE) | Potential if natural/synthetic diamond and all conditions hold (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Gem Jewellery | Potential standard supply (TRANSACTION_FACT) | Only legal reason/evidence (OFFICIAL_UAE_RULE) | Potential only for specified stones and full conditions; unspecified gem is not assumed covered (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Loose Gem | Potential standard supply (TRANSACTION_FACT) | Only legal reason/evidence (OFFICIAL_UAE_RULE) | Potential for ruby/sapphire/emerald where all conditions hold; other stones require separate legal classification (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Pearl Jewellery | Potential standard supply (TRANSACTION_FACT) | Only legal reason/evidence (OFFICIAL_UAE_RULE) | Potential where pearl goods/value/registration/intent/evidence conditions hold (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |
| Loose Pearl | Potential standard supply (TRANSACTION_FACT) | Only legal reason/evidence (OFFICIAL_UAE_RULE) | Potential where pearl goods and all VATP043 conditions hold (OFFICIAL_UAE_RULE) | Only verified scope fact (TRANSACTION_FACT) |

## 21. Customer Onboarding

Customer onboarding is a product workflow, not developer-owned production data:

1. Company Identity.
2. UAE Tax Configuration.
3. Branches.
4. Inventory Locations.
5. Financial Readiness.
6. Supplier setup through the customer-owned Supplier module.
7. Operational Readiness.

The onboarding model must show unset versus configured states, require authorized customer actions, and never insert a fake Supplier, Location, TRN, or VAT registration status.

## 22. First Run vs Operational Readiness

SYSTEM_FIRST_RUN_READY means:

- Company/User/Branch exist.
- Financial foundation and reference master data are available.
- System bootstrap state is READY.

OPERATIONAL_RECEIVE_READY for SUPPLIER_RECEIVE means:

- Company tax policy is configured or the workflow is explicitly non-taxable by a valid legal result.
- VAT registration policy/evidence is in the required state.
- Persisted rate/policy is ready when required.
- Financial mappings are ready.
- Active branch Location exists.
- Active company Supplier exists for SUPPLIER_PURCHASE.
- Transaction treatment and legal eligibility are resolvable.

The Official DB can be SYSTEM_FIRST_RUN_READY while remaining OPERATIONAL_RECEIVE_READY=NO.

## 23. Operational Readiness Gate

Design:

evaluateOperationalReadiness(companyId, branchId, workflow)

For SUPPLIER_RECEIVE it returns:

~~~json
{
  "status": "READY|BLOCKED",
  "workflow": "SUPPLIER_RECEIVE",
  "missingRequirements": [],
  "warnings": [],
  "policyVersion": null,
  "taxRuleVersion": null
}
~~~

Possible exact missing requirement codes:

- VAT_POLICY_UNCONFIGURED
- VAT_REGISTERED_UNSET
- TRN_REQUIRED_BY_POLICY
- VAT_RATE_UNCONFIGURED
- NO_ACTIVE_LOCATION
- NO_ACTIVE_SUPPLIER
- FINANCIAL_MAPPING_NOT_READY
- TAX_POLICY_NOT_READY
- TAX_TREATMENT_NOT_RESOLVABLE
- RCM_EVIDENCE_REQUIRED

The evaluator is a read/policy decision service. It does not create master data and does not bypass receive validation.

## 24. Supplier Product Authority

Supplier is a customer-owned company-scoped master:

- Add, edit, disable, search/select, and audit.
- Supplier is mandatory only for SUPPLIER_PURCHASE.
- Tax identity/payment terms are optional capabilities only where supported by the approved source design.
- No Default Supplier exists.
- Development and acceptance may use isolated synthetic Supplier fixtures only; none are inserted into darfus_erp in this control.

## 25. Location Product Authority

Location remains customer-owned branch-scoped DB master data:

- Add.
- Edit safe fields.
- Disable.
- Active selector.
- Company/branch scope.
- No free-text authority.
- No Showroom fallback.
- Synthetic Locations are test-only and isolated.
- Used Locations are not destructively deleted.

## 26. TRN Product Authority

- Real customer TRN is entered later by the authorized end customer.
- Developer real TRN is not required.
- A TRN-format synthetic value may exist only in isolated test fixtures.
- TRN must not infer VAT registration.
- Where RCM law requires evidence, distinguish stored TRN, verification evidence reference, verification timestamp, and verification source.
- No secret or credential is stored in this design.

## 27. Synthetic Data Policy

ALL DEVELOPMENT / ACCEPTANCE DATA = SYNTHETIC.

Allowed only in isolated test scope:

- Demo Company.
- Demo Tax Policy.
- Synthetic TRN-format value.
- Demo Supplier.
- Demo Location.
- Demo transactions.

Forbidden automatic production defaults:

- Default Supplier.
- Showroom.
- Main Warehouse.
- Fake TRN.
- VAT Registered = YES.
- Default Tax Treatment that silently changes business/legal behavior.

Synthetic values never become production defaults and are never inserted into Official DB by G1A.

## 28. Product Defaults Classification

| Value | Classification | Authority treatment |
|---|---|---|
| UAE standard VAT rate 5% | LEGAL_CONSTANT | Official UAE rate; still requires customer policy/context before production application |
| settings service vatRate fallback 5 | SYSTEM_SAFE_DEFAULT | Runtime fallback only; not approved customer configuration |
| vatEnabled fallback true | SYSTEM_SAFE_DEFAULT | Operational fallback; not VAT registration |
| taxIncluded fallback false | SYSTEM_SAFE_DEFAULT | Source behavior only; not universal legal policy |
| recoverability fallback true | SYSTEM_SAFE_DEFAULT | Source behavior only; legal recovery still applies |
| input VAT account 1400 fallback | SYSTEM_SAFE_DEFAULT | Current source fallback; not a universal financial authority |
| RCM output account 2210 fallback | SYSTEM_SAFE_DEFAULT | Current source fallback; not a universal financial authority |
| Showroom | FORBIDDEN_FAKE_DEFAULT | Must not become Location authority |
| Default Supplier | FORBIDDEN_FAKE_DEFAULT | Never seed |
| Default Tax Treatment | FORBIDDEN_FAKE_DEFAULT unless explicitly configured by customer policy | Must remain unset/explicit |

Source fallback is not automatically an approved production default.

## 29. Historical Rule Versioning

Every future tax snapshot should preserve:

- taxRuleJurisdiction = UAE.
- taxRuleVersion or legal source identifier.
- effective date.
- resolved treatment.
- calculated rate.
- calculated amounts.
- eligibility reason.
- evidence references.
- company policy snapshot/version where relevant.

Old transactions are never recalculated after law, rule, or company setting changes. The 26 February 2025 VATP043 effective boundary must be preserved for future eligibility evaluation.

## 30. E-Invoicing Future Compatibility

The official MoF portal defines an eInvoice as structured invoice data exchanged electronically and reported to the FTA; unstructured PDF/Word/image/email formats are not eInvoices. The official portal and MoF rollout material identify future accredited service provider/4-Corner integration and phased implementation.

Current DARFUS Invoice source already has company/customer identity, customer snapshots, invoice number, totals, tax, vatRate, branch, and invoice items. However, no e-invoicing/Peppol/ASP/submission model, structured tax-category code, legal-rule lineage, or FTA reporting status was found in the current source.

E_INVOICING_IMMEDIATE_SCOPE = NO  
E_INVOICING_SCHEMA_FUTURE_COMPATIBILITY = GAP

The tax-policy design does not block future e-invoicing if immutable tax treatment/rule/snapshot fields and structured identity fields are preserved. Full e-invoicing is outside G1A.

## 31. Remaining True Owner Decisions

The following are customer/business choices, not legal rules to invent:

- Actual customer VAT registration status and evidence.
- Actual customer TRN or N/A policy.
- Customer-approved persisted VAT configuration.
- Enabled operational treatments.
- Optional preferred/default treatment.
- Tax-included preference where legally valid.
- Customer financial account mappings.
- Customer Supplier and Location values.
- Supplier verification evidence and declarations for RCM.
- Recipient resale/production intent per transaction.

The following require UAE tax-professional confirmation before production legal reliance when the fact is not already proven by the source context:

- Exact company-specific treatment for a mixed/composite jewellery supply.
- RCM treatment where precious-goods value versus other components is uncertain.
- Input-tax recovery/apportionment for mixed taxable/exempt activity.
- Designated Zone/out-of-scope classification in a specific customer case.

No Owner is asked to invent a legal rule. The Tax Engine must encode official rules; the customer supplies facts/policy.

## 32. Minimum Safe Implementation Batches

| Batch | Scope | Prerequisites | No automatic start |
|---|---|---|---|
| 03B-G2A1 | UAE Tax Engine + Company Tax Policy schema/service | This authority freeze, legal-source review, approved data model | YES |
| 03B-G2A2 | Transaction Tax Treatment snapshot + Precious-Goods RCM eligibility/evidence | G2A1, VATP043 rule model, accounting review | YES |
| 03B-G2B | Canonical Location management | Existing table verification, permission decision | YES |
| 03B-G2C | Receive UI/API cleanup: explicit treatment, Location selector, remove free-text/Showroom authority | G2A2 and G2B | YES |
| 03B-G2D | Operational Readiness Gate + onboarding configuration UX | G2A1/G2A2/G2B/G2C | YES |
| 03B-G3 | Disposable browser/backend/DB/accounting acceptance using synthetic data | Safe isolated target and approved tests | YES |
| Later | GBW/GBP controlled acceptance with synthetic/demo company | G3 PASS | YES |

No implementation is started by this report.

## 33. Files Changed

| File | Change |
|---|---|
| docs/DARFUS_PHASE_03B_G1A_COMMERCIAL_UAE_PRODUCT_TAX_ONBOARDING_AUTHORITY_FREEZE_REPORT.md | Created this read-only authority-freeze report |

No Source, Test, Migration, .env, configuration, or runtime file was changed. AGENTS.md and next-env.d.ts were not edited.

## 34. Official DB Mutation Proof

~~~
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
INSERT = 0
UPDATE = 0
DELETE = 0
TRUNCATE = 0
ALTER = 0
DROP = 0
CREATE_TABLE = 0
MIGRATIONS_APPLIED = 0
SEED = 0
SUPPLIER_WRITES = 0
LOCATION_WRITES = 0
SETTINGS_WRITES = 0
RECEIVE = 0
ASSET_WRITES = 0
JOURNAL_WRITES = 0
PAYMENT_WRITES = 0
~~~

## 35. Gate

The official sources needed for this authority freeze were available and reviewed. The product authority, UAE-only jurisdiction, Company Policy versus Legal Eligibility separation, all five tax treatments, Precious-Goods RCM authority, onboarding/readiness model, synthetic-data policy, default classification, implementation batches, and future e-invoicing boundary are defined without guessed customer values or guessed legal rules.

GATE = PASS_PHASE_03B_G1A_COMMERCIAL_UAE_PRODUCT_TAX_ONBOARDING_AUTHORITY_FROZEN

This PASS is an authority/design freeze only. It does not authorize production configuration, real Supplier/Location creation, Receive, or implementation.

## 36. Next Recommended Control

NEXT_RECOMMENDED_STEP = 03B-G2A1_MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION

Before G2A1:

- Owner reviews this authority freeze.
- Tax professional review is obtained for customer-specific legal scenarios before production use.
- Exact implementation scope and migration/rehearsal safety gate are separately approved.
- Development remains synthetic-only.

No next batch starts automatically.

## 37. Final Tokens

~~~
CURRENT_CONTROL = DARFUS-PHASE-03B-G1A-COMMERCIAL-UAE-PRODUCT-TAX-ONBOARDING-AUTHORITY-FREEZE
PHASE = 03B-G1A
MODE = READ_ONLY_PRODUCT_AND_UAE_TAX_AUTHORITY_FREEZE

PRODUCT_TYPE = COMMERCIAL_ERP_PRODUCT
SYSTEM_COUNTRIES = UAE_ONLY
COMPANY_TAX_POLICY = YES
PRODUCT_NOT_BOUND_TO_OWNER_COMPANY = YES

REAL_OWNER_COMPANY_DATA_REQUIRED_DURING_DEVELOPMENT = NO
DEVELOPMENT_DATA_POLICY = SYNTHETIC_ONLY
END_CUSTOMER_ENTERS_PRODUCTION_CONFIGURATION = YES

UAE_STANDARD_VAT_RATE_AUTHORITY = 5_PERCENT_OFFICIAL_UAE_VAT_RULE
PRECIOUS_GOODS_RCM_CURRENT_AUTHORITY = VATP043_CABINET_DECISION_127_2024_SERVER_ELIGIBILITY
PRECIOUS_GOODS_RCM_EFFECTIVE_DATE = 2025-02-26
VATP043_SUPERSEDES_VATP032 = YES

UAE_TAX_ENGINE_AUTHORITY = SYSTEM_OWNED_OFFICIAL_UAE_RULES_AND_VERSIONED_ELIGIBILITY
COMPANY_POLICY_AUTHORITY = COMPANY_SCOPED_OPERATIONAL_POLICY_WITHOUT_LEGAL_OVERRIDE
TRANSACTION_LEGAL_ELIGIBILITY_AUTHORITY = SERVER_SIDE_UAE_TAX_ENGINE_USING_TRANSACTION_FACTS

STANDARD_VAT_STATUS = DEFINED
ZERO_RATED_STATUS = DEFINED_WITH_LEGAL_REASON_AND_EVIDENCE
REVERSE_CHARGE_STATUS = DEFINED_BY_VATP043_ELIGIBILITY_AND_EVIDENCE
EXEMPT_STATUS = DEFINED_AS_LEGAL_CATEGORY_NOT_GENERIC_NO_VAT
OUT_OF_SCOPE_STATUS = DEFINED_AS_JURISDICTION_SCOPE_OUTCOME_NOT_GENERIC_NO_VAT

MAKING_SERVICE_TAX_STRUCTURE = COMPOSITE_SUPPLY_FOLLOWS_PRINCIPAL; MULTIPLE_SUPPLIES_RESOLVED_SEPARATELY

OWNER_REAL_COMPANY_TRN_REQUIRED_NOW = NO
OWNER_REAL_SUPPLIER_REQUIRED_NOW = NO
OWNER_REAL_LOCATION_REQUIRED_NOW = NO
OWNER_REAL_VAT_CONFIG_REQUIRED_NOW = NO
DEVELOPMENT_CAN_CONTINUE_WITH_SYNTHETIC_DATA = YES

SUPPLIER_PRODUCTION_DEFAULT = NONE
LOCATION_PRODUCTION_DEFAULT = NONE
FAKE_TRN_DEFAULT = NONE
VAT_REGISTERED_DEFAULT = UNSET

E_INVOICING_IMMEDIATE_SCOPE = NO
E_INVOICING_SCHEMA_FUTURE_COMPATIBILITY = GAP

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
SOURCE_CODE_CHANGED = NO
TEST_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
MAIN_RUNTIME_RESTARTED = NO

PRODUCTION_CONFIGURATION_APPLIED = NO
REAL_RECEIVE_ALLOWED = NO

COMMERCIAL_PRODUCT_AUTHORITY = FROZEN
UAE_ONLY_JURISDICTION = FROZEN
UAE_TAX_ENGINE_AUTHORITY = DEFINED
PRECIOUS_GOODS_RCM_AUTHORITY = DEFINED
COMPANY_POLICY_VS_LEGAL_ELIGIBILITY = DEFINED
ALL_5_TAX_TREATMENTS = DEFINED_OR_EXPLICITLY_NON_APPLICABLE
NO_GUESSED_ACCOUNTING_MAPPING = YES
ONBOARDING_MODEL = DEFINED
OPERATIONAL_READINESS_MODEL = DEFINED
SYNTHETIC_DATA_POLICY = DEFINED
NO_REAL_OWNER_DATA_REQUIRED = YES
IMPLEMENTATION_BATCHES = DEFINED

GATE = PASS_PHASE_03B_G1A_COMMERCIAL_UAE_PRODUCT_TAX_ONBOARDING_AUTHORITY_FROZEN
NEXT_RECOMMENDED_STEP = 03B-G2A1_MINIMUM_SAFE_UAE_TAX_ENGINE_AND_COMPANY_POLICY_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
~~~

توقف هنا — OWNER REVIEW مطلوب. لا يتم تنفيذ G2A1 أو أي Provisioning أو Production Configuration تلقائيًا.
