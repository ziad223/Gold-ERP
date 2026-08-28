# UX-9 Dependency Map

```text
Auth/company/branch context
          │
          ├── Accounting GET hooks ──> overview / chart / reports
          └── Treasury GET hooks ────> register / summary / movements

Financial account catalog + branch mappings ──> resolver ──> posting/journal authority
Tax / inventory / Gift Voucher authorities ──> consumed by existing flows, untouched by UX-9
```

The CSS scope is rooted at each page, so it cannot style unrelated screens. No dependency is changed.
