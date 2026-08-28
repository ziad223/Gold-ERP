# UI visibility and accessibility evidence

| View | Evidence | Result |
|---|---|---|
| Desktop EN | Browser DOM at `/en/inventory/gold-by-weight` shows only `Global Gold Rate At Purchase / g`; no reason label/control. | Missing |
| Desktop AR | The same component renders locale-dependent labels, but the source has no reason state/control in either locale. | Missing |
| Tablet | No JSX/state/control exists that could become visible at a breakpoint. | Missing by source; no breakpoint-specific implementation exists. |
| Mobile | No JSX/state/control exists that could become visible at a breakpoint. | Missing by source; no breakpoint-specific implementation exists. |
| Keyboard/touch | No reason control exists to focus or operate. | Not applicable until an authorized UI change. |
| Error text | `caught?.message` is displayed directly; backend English can surface in AR. | Separate P2 localization/observability issue. |

Runtime DOM also showed the manual override contract marker as `Fail-closed` and the purchase rate input as editable. This demonstrates the UI can expose the decision input while omitting the required evidence input.

