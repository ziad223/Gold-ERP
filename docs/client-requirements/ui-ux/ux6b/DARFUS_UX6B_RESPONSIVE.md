# UX-6B Responsive Evidence

| View | Evidence | Result |
|---|---|---|
| Desktop | EN/AR Light/Dark focused preview | PASS |
| Tablet | AR Dark at requested responsive setting; tag remains inside local overflow surface | PASS |
| Mobile | AR Dark at requested responsive setting; print button reachable and body remains bounded | PASS |

Measured after: tablet browser-reported viewport approximately `933`, body/client width `925/925`; mobile approximately `467`, body/client width `459/459`. The tag's wide paired faces are contained by the existing local `overflow-x-auto`; body overflow was not introduced.

