# UX4B Dark/Light Runtime Matrix

| Locale | Theme | Actual signal | Overflow | Console errors/warnings |
|---|---|---|---|---|
| AR | Dark | root theme `dark`; background `rgb(6,15,25)` | none | 0 |
| AR | Light | root theme `light`; HTML dark class removed; background `rgb(246,248,251)` | none | 0 |
| EN | Dark | dark token surface rendered | none | 0 |
| EN | Light | light token surface rendered | none | 0 |

Theme switching is scoped to the reference surface and restores the prior document class when the surface unmounts.

