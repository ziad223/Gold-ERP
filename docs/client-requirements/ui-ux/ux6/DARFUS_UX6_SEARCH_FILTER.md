# UX-6 Search / Filter Proof

The existing list contract remains:

`useInventoryV2List({ search, profile, status, condition, tagState, page, pageSize, sort: "createdAt", direction: "DESC" })`.

Search keeps the existing 250 ms debounce and page reset. Clear filters still resets search, profile, status, condition, tag state, and the existing page behavior. No API request shape, backend filter, or read authority changed.

