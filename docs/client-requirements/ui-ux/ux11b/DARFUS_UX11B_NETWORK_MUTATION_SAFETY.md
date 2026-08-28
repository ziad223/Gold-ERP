# Network / Mutation Safety

Allowed activity was navigation, GET-backed invoice detail, opening/closing the existing options dialog, locale navigation, and theme toggling. No Print/Reprint, issue/redeem, receive, checkout, payment, posting, inventory, accounting, or cleanup action was invoked. The local print runner observed `mutatingRequests = []`.

`UX11B_CONTROL_OWNED_PRINT_MUTATIONS = 0`; `UX11B_CONTROL_OWNED_BUSINESS_MUTATIONS = 0`.
