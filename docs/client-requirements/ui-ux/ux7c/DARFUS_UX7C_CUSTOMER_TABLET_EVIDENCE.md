# UX7C Customer Tablet Evidence

Direct Chrome/Playwright measured `840×1180` and authenticated successfully. The post-login route was `/ar/dashboard`, showing `Branch readiness required` / `Select an active Branch to continue`. The Customer list/detail/form could not be opened in a populated, valid Branch context without changing context or data.

| Gate | Result |
|---|---|
| CUSTOMER_LIST_TABLET | BLOCKED_AUTH_BRANCH_CONTEXT |
| CUSTOMER_DETAIL_TABLET | BLOCKED_AUTH_BRANCH_CONTEXT |
| CUSTOMER_FORM_TABLET | BLOCKED_AUTH_BRANCH_CONTEXT |
| CUSTOMER_FORM_SUBMITTED | NO |
