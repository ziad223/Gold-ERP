# UX-6 Route / Surface Inventory

| Surface | Route | UX-6 disposition | Authority note |
|---|---|---|---|
| Inventory overview/list | `/[locale]/inventory` | In scope: presentation only | `useInventoryV2List`; Asset rows are the physical authority |
| Asset detail | `/[locale]/inventory/[id]` | In scope: presentation only | `useInventoryV2Detail`; existing action handlers preserved |
| Unified intake chooser | overview `Add / Receive Inventory` | Inspect/preserve only | No chooser or receive behavior changed |
| Inventory locations | `/[locale]/inventory/locations` | Preserve | DB-backed location authority; no change |
| Adjustments | `/[locale]/inventory/adjustments` | Preserve | business workflow; no change |
| Transfers | `/[locale]/inventory/transfers` | Preserve | lifecycle workflow; no change |
| Workshop | `/[locale]/inventory/workshop` | Preserve | lifecycle workflow; no change |
| Stock audit | `/[locale]/inventory/stock-audit` | Preserve | closed Inventory Count authority; not reopened |
| Profile intake pages | `/gold-by-weight`, `/gold-by-piece`, `/diamond-jewellery`, `/gem-stone`, `/pearl`, and loose-profile routes | Preserve | profile business contracts; no change |
| Asset detail panels | revision, selling price, RFID, tag/history panels | Inspect/preserve only | permission and mutation boundaries unchanged |

