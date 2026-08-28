# UX4C Focus Regression Test

Focused test: `tests/ux4c-drawer-focus.test.cjs`.

It protects:

- existing `DrawerProps` contract;
- active-trigger capture;
- connected-node guard;
- focus entry to `Close drawer`;
- exact-trigger focus restoration call;
- no added trigger prop or contract widening.

Real-browser acceptance covers inner close button and overlay close. Escape was verified as unsupported before and after and was not added. Result: test suite `13/13 PASS` including UX3, UX4, and UX4B checks.

