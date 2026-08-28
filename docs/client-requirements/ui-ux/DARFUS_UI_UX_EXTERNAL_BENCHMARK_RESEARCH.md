# UX-0B External Benchmark Research

Access date for all links: 2026-08-27. Sources were used for principles only; no brand layout, copy, or proprietary styling is being copied.

| Family | Source | Pattern observed | DARFUS adaptation | What not to copy / risk |
|---|---|---|---|---|
| Modern enterprise | [SAP Fiori responsive table](https://experience.sap.com/fiori-design-web/responsive-table/) | responsive line items, priority/pop-in details, one-item-at-a-time mobile reading | keep identity column and move lower-priority data into readable details | do not force a table where a list/detail is clearer |
| Modern enterprise | [SAP Fiori table overview](https://experience.sap.com/fiori-design-web/table-overview/) | separates responsive tables from desktop-centric analytical tables | choose table family by task and data complexity | do not call a desktop grid responsive merely because it scrolls |
| Enterprise system | [IBM Carbon data table](https://carbondesignsystem.com/components/data-table/usage/) | configurable data tables, consistent actions, accessibility testing | standardize density, actions, headers and numeric alignment later | do not reproduce Carbon branding or assume one density fits all |
| Enterprise layout | [Microsoft Fluent layout](https://fluent2.microsoft.design/layout) | fluid layouts, explicit size classes and breakpoints | define DARFUS breakpoints and component priority rules | do not target device names without testing content |
| Luxury craft | [Tiffany heritage](https://www.tiffany.com/world-of-tiffany/heritage.html) | craftsmanship, enduring design, material precision | restrained material-inspired accent and precise hierarchy | do not copy Tiffany color/marks or turn ERP into storefront marketing |
| Fintech/data | [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/) | high-performance streaming data presentation | use tabular numerals and low-latency feedback where already applicable | do not add charts without a business need |
| Financial terminal | [Bloomberg Professional](https://www.bloomberg.com/professional/) | integrated real-time data, research, analytics and configurable workspaces | prioritize market/rate clarity, filters, compact views and auditability | do not imitate terminal density, keyboard codes, or visual identity |
| Motion/accessibility | [W3C animation from interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) | non-essential interaction animation should be disableable | reduced-motion policy and minimal critical-operation motion | no decorative continuous motion or motion that hides state |
| Motion implementation | [W3C prefers-reduced-motion technique](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html) | respect user motion preference | define reduced-motion behavior in UX-1 tokens | no WCAG certification claim from this research |

Key synthesis: hierarchy, responsive task adaptation, precise numerics, restrained premium cues, and accessibility are reusable. Trademarked palettes, storefront composition, terminal mimicry, and animation spectacle are rejected.
