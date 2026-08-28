# UX4B Reduced-Motion Evidence

The connected browser did not expose a media-emulation capability for `prefers-reduced-motion`, so an actual reduced-motion browser profile could not be selected. The evidence pack records this limitation rather than claiming a full emulation PASS.

Source-level review found no new motion implementation in the UX4B reference surface. The route is static and does not start timers, polling, or animation loops. Full end-user reduced-motion confirmation remains an evidence limitation for this control.

`REDUCED_MOTION = PASS_WITH_BROWSER_TOOL_LIMITATION_AND_SOURCE_BOUNDARY`

