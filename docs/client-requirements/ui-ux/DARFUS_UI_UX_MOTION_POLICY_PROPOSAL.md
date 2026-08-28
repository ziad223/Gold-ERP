# Motion Policy Proposal

Motion is `ALLOWED_IF_SAFE`, not a visual requirement. Use short transform/opacity transitions for drawer/modal entry, focus feedback, filter expansion, row detail expansion, and success acknowledgement only when they do not delay action, shift layout unpredictably, or hide a state.

Mandatory rules:

- honor `prefers-reduced-motion`; remove or sharply shorten non-essential transitions;
- never use decorative infinite animation, pulsing totals, or moving backgrounds;
- POS confirmation, accounting value reading, rapid data entry, financial tables, barcode/inventory scanning, and immediate error recovery use minimal or no motion;
- loading indicators must communicate waiting state without moving the data layout;
- motion must not change workflow sequence, validation timing, payload, or business state.

`MOTION_POLICY_PROPOSED = YES`
`MOTION_RESEARCH = COMPLETE_WITH_W3C_EVIDENCE`
