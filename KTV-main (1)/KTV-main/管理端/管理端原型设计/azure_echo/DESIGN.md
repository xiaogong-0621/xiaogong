# Design System Strategy: The Hydro-Sonic Canvas

## 1. Overview & Creative North Star
This design system moves beyond the utility of a song-ordering tool to create **"The Hydro-Sonic Canvas."** The visual metaphor is inspired by the clarity of water and the precision of sound waves. We are rejecting the cluttered, dark, neon-heavy "traditional KTV" aesthetic in favor of a high-end, refreshing editorial experience.

### Creative North Star: Fluid Precision
The system prioritizes **Lightweight Efficiency** through an intentional use of white space and "breathable" layouts. We break the rigid WeChat Mini Program grid by using **Intentional Asymmetry**—for instance, song categories may utilize staggered card heights, and hero headers use aggressive typography scales to create a sense of rhythm and movement. The goal is to make the user feel like they are "gliding" through the song catalog.

---

## 2. Colors: The Tonal Architecture
The palette avoids the "starkness" of pure black and white, opting for a sophisticated range of cool blues and layered neutrals.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or cards. Hierarchy must be achieved through **Tonal Transitions**. A card should be distinguishable from the background solely by a shift from `surface` (#f7f9fb) to `surface_container_lowest` (#ffffff) or a subtle shift to `surface_container_low` (#f2f4f6).

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of semi-transparent materials:
*   **Base Layer:** `surface` (#f7f9fb).
*   **Secondary Content Areas:** `surface_container` (#eceef0).
*   **Interactive Cards:** `surface_container_lowest` (#ffffff).
*   **The "Glass & Gradient" Rule:** For the "Currently Playing" bar or floating song queue, use `surface_container_lowest` with a 70% opacity and a 20px backdrop blur. Main CTAs (like "Order Now") should use a subtle linear gradient from `primary` (#006399) to `secondary` (#005db7) to add "soul" and depth.

---

## 3. Typography: Editorial Rhythm
We pair **Plus Jakarta Sans** (Display/Headlines) with **Manrope** (Body/Labels) to create a tech-forward, premium feel.

*   **The Hero Statement:** Use `display-lg` for room numbers or personalized greetings. The sheer scale creates an authoritative, high-end editorial look.
*   **The Information Gap:** Maintain high contrast between `headline-sm` (Song Titles) and `label-md` (Artist/Genre). 
*   **Type as Branding:** Typography is not just for reading; it is a graphical element. Use `title-lg` with generous letter-spacing for category headers to create a "boutique" atmosphere.

---

## 4. Elevation & Depth: Tonal Layering
Traditional dropshadows are replaced with **Ambient Lift**.

*   **The Layering Principle:** Depth is achieved by "stacking." For example, a search bar (`surface_container_highest`) sits inside a header (`surface_container_low`), which sits on the main background (`surface`). This creates a soft, natural hierarchy.
*   **Ambient Shadows:** When a card must float (e.g., a "Song Added" confirmation), use a shadow with a 32px blur, 0px offset-y, and 6% opacity using a tint of `on_surface` (#191c1e). It should feel like a soft glow, not a hard edge.
*   **The Ghost Border:** For accessibility in input fields, use the `outline_variant` token at **15% opacity**. This provides a "suggestion" of a boundary without breaking the flat aesthetic.

---

## 5. Components: Bespoke Implementation

### Cards & Lists (The Sonic Grid)
*   **Prohibition:** Never use divider lines. 
*   **Execution:** Use `40px` (2.5rem) of vertical whitespace between song items. Use a `surface_container_low` background for the "selected" state of a song card.
*   **Rounding:** Apply `xl` (3rem) to major category cards and `lg` (2rem) to song item cards.

### Buttons (High-Speed Actions)
*   **Primary:** Pill-shaped (`full` roundedness), using `primary` (#006399).
*   **Secondary/Tertiary:** Use `primary_fixed` (#cde5ff) with `on_primary_fixed` (#001d32) text for a "refreshing" low-contrast alternative that remains highly legible.

### The "Sonic Queue" FAB (Floating Action Button)
A large, circular button (`full` radius) using a `Glassmorphism` effect: `primary_container` (#4fb3ff) at 80% opacity with a heavy backdrop blur. This keeps the "high-speed" song-ordering tools always within thumb reach.

### Input Fields
*   **Style:** Minimalist. No bottom line. Use `surface_container_high` (#e6e8ea) as the fill color with `lg` (2rem) rounded corners. Text should be `body-lg` for maximum legibility in low-light KTV environments.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins (e.g., 24px left, 16px right) on hero banners to create a dynamic, modern feel.
*   **Do** use `tertiary_container` (#e39f14) sparingly for "VIP" or "Hot" tags to provide a sophisticated pop of color against the blue/white base.
*   **Do** maximize the use of `lg` and `xl` border radii to make the UI feel friendly and organic.

### Don't:
*   **Don't** use 100% black (#000000). Use `on_surface` (#191c1e) for all primary text to maintain the "soft" atmospheric quality.
*   **Don't** use standard "Material Design" shadows. If it looks like a default template, increase the blur and decrease the opacity.
*   **Don't** crowd the screen. If a user can see more than 6 song titles at once, the information density is too high—increase the whitespace.

---

## 7. Interaction Note: High-Speed Response
Every tap must feel instantaneous. Use subtle scale-down animations (98%) on card presses to provide tactile feedback without the need for heavy visual changes. This reinforces the "Efficiency" aspect of the brand identity.