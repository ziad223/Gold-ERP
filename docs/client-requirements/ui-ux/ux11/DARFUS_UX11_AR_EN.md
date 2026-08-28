# UX-11 AR / EN

| Check | Evidence | Result |
|---|---|---|
| English route | `/en/sales/search-print`, `/en/inventory/<asset>` | `lang=en`, `dir=ltr`, no body overflow |
| Arabic route | `/ar/sales/search-print`, `/ar/inventory/<asset>` | `lang=ar`, `dir=rtl`, no body overflow |
| Asset tag direction | Mounted `data-print-root` on both routes | Preserved by existing template; no content mutation |
| Browser console | `tab.dev.logs({levels:[error,warn]})` | Empty |

