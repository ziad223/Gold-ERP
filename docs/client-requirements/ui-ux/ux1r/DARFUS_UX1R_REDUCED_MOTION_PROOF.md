# UX-1R Reduced Motion Proof

The served prototype CSS contains `@media (prefers-reduced-motion: reduce)` and reduces transitions/animations, disables scroll behavior and removes transforms. Browser tooling did not expose OS media emulation, so this is proven as a served CSS contract rather than an emulated preference assertion.

`REDUCED_MOTION_DEMO = PASS_CSS_CONTRACT`
