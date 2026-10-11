# Timur Forms Design Rules

## Visual Direction

- Style tone: bright editorial workspace with soft paper-like panels, clear hierarchy, and confident contrast.
- Interface should feel structured and calm, not generic dashboard boilerplate.

## Tokens

- Primary accent: `#015f86` for primary actions and important links.
- Secondary accent: `#e29a36` for warnings and status transitions.
- Surface base: light layered cards (`#fbfcfe`, `#f2f6fb`) over a soft radial background.
- Text:
- Heading/body foreground: `#0f1a2a`.
- Secondary/supporting text: slate shades around `#475569`.

## Typography

- Display/body family: Space Grotesk.
- Monospace family: IBM Plex Mono.
- Scale:
- Page title: 2.0rem to 3.0rem depending on breakpoint.
- Section heading: 1.25rem to 1.75rem.
- Body: 1rem.
- Meta/support text: 0.875rem.

## Layout and Spacing

- Primary content max width: 72rem for dashboard pages, 56rem for focused forms.
- Grid spacing baseline: 0.75rem / 1rem / 1.5rem / 2rem.
- Card radius: 1rem to 1.25rem.
- Keep action buttons grouped near their related content.

## Component States

- Inputs must show clear focus ring and distinct disabled appearance.
- Required field indicators are explicit (`*`).
- Submission statuses use plain-language labels: Draft, Submitted, Reopened.
- Reopen actions should use warning color and optional reason text.

## Motion

- Use subtle transition timing around 180ms for interaction feedback.
- Avoid large playful motion on data-heavy pages.

## Responsive Rules

- Mobile-first layout with single-column cards below `md` breakpoint.
- Multi-column card grids enabled at `md` and above.
- Buttons should remain comfortably tappable on small screens.

## Accessibility

- Every form control has an associated label.
- Keyboard interaction must cover links, buttons, radios, and checkboxes.
- Preserve readable contrast for all text and critical states.
