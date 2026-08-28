# Payload mapping

The existing `piece.purchaseRateOverrideReason` key is added only when the presentation-only override condition is active. The same `receiveItem` path used by shared preview carries it, and the Confirm/Receive builder carries it in the final `piece`. Equal-rate requests omit it. Backend accepted paths remain unchanged.

`REASON_PAYLOAD_MAPPING = PASS`  
`BACKEND_API_CONTRACT_CHANGED = NO`  
`PREVIEW_RECEIVE_AUTHORITY = PRESERVED`

