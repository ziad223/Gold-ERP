# UX-12B Raw Console and Hydration

18 representative routes were loaded in local Chrome: AR/EN dashboard, POS, Customers, Inventory, Gold Center, Accounting, Settings, Audit and Invoice Search/Print. `tab.dev.logs` returned raw arrays with 0 errors and 0 warnings; visible application-error, hydration-error and error-boundary text was absent on all 18. Separate `pageerror`/`requestfailed` event hooks are not exposed by the connected browser API, so `RAW_CONSOLE_CAPTURE = PARTIAL_API_LIMITATION`, not an unsupported COMPLETE claim.
