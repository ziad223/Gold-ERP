# Forms Audit

Evidence: real DOM on POS, Gold By Weight, Gold By Piece, Diamond Jewellery, Loose Diamond, Loose Gem Stone, Loose Pearl, settings/tax, onboarding, employees and accounting.

Common pattern: `label-base`, `input-base`, `NativeSelect`, numeric/date inputs, numbered sections, and explicit required markers. Strengths are consistent heights, server-backed selectors, and visible section headings. Risks are many equal-weight fields, some controls without an associated `label[for]` (POS read-only audit found multiple unlabeled native controls), mixed helper-text language, and long forms that require extensive scrolling. Financial/weight fields are recognizable but need a future focus/precision matrix.

Classification: P1 in critical forms for hierarchy/label association; P2 elsewhere. No form structure was changed.
