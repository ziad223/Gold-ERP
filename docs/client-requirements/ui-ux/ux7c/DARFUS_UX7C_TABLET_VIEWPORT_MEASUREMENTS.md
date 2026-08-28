# UX7C Tablet Viewport Measurements

Direct Playwright created the requested real Tablet viewport:

| Page state | innerWidth | innerHeight | clientWidth | clientHeight | body.scrollWidth | documentElement.scrollWidth | devicePixelRatio |
|---|---:|---:|---:|---:|---:|---:|---:|
| Login before authentication | 840 | 1180 | 840 | 1180 | 840 | 840 | 1 |
| Authenticated dashboard | 840 | 1180 | 840 | 1180 | 840 | 840 | 1 |

`TABLET_VIEWPORT_MEASURED = YES`, `TABLET_WIDTH = 840`, `TABLET_HEIGHT = 1180`.

The required viewport itself is proven. The remaining blocker is authenticated Branch context: after login the application displayed `Branch readiness required` and no populated Customer/Supplier surface was available.
