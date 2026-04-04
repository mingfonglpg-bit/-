# Design System Document: Industrial Precision & Fluid Utility

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Architect"**
In a warehouse environment, design must be more than "clean"—it must be authoritative and frictionless. This design system moves away from the static, boxy nature of traditional logistics software. We embrace "The Kinetic Architect": a philosophy where the UI feels like a high-performance tool, using architectural layering, expansive breathing room, and a bold, editorial typographic hierarchy to guide the eye through dense data.

By utilizing intentional asymmetry and overlapping surface layers, we transform a functional WMS into a premium digital experience. We prioritize speed of recognition over decorative density, ensuring that a warehouse operator can make split-second decisions with absolute confidence.

---

### 2. Colors: Tonal Architecture
We move beyond flat UI by using a "Tonal Architecture" approach. The interface is defined not by lines, but by the weight of color and the depth of surfaces.

*   **Primary (Professional Blue):** `#005dac` — Used for high-level navigation and primary actions. It communicates stability.
*   **Secondary (Industrial Orange):** `#964900` (Container: `#fc820c`) — Used for high-visibility alerts, scanning states, and critical "Low Stock" warnings.
*   **Tertiary (Efficiency Green):** `#0d6c1e` — Reserved for "In Stock" and successful operation confirmations.

#### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning. 
Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a natural, sophisticated break. If a container needs to stand out, use the `surface-container-highest` token to lift it visually without the "jail-cell" feel of borders.

#### The "Glass & Gradient" Rule
To elevate the industrial feel, use **Signature Textures**. Main Action Buttons (CTAs) should utilize a subtle linear gradient from `primary` (#005dac) to `primary_container` (#1976d2). For floating scanning modules, employ **Glassmorphism**: use `surface` with 80% opacity and a `20px` backdrop blur to allow the warehouse map or inventory list to bleed through, creating a sense of environmental awareness.

---

### 3. Typography: Editorial Clarity
The typography system pairs **Plus Jakarta Sans** (for Latin numerals/headers) with **PingFang SC** (for Chinese body text) to create a high-contrast, editorial look. Numerals are the lifeblood of a WMS; they must be large, bold, and unmistakable.

*   **Display (L/M/S):** Used for SKU counts and massive bin locations. High-weight Plus Jakarta Sans creates a "command center" feel.
*   **Headline (L/M/S):** Used for page titles like "Outbound Logistics."
*   **Title (L/M/S):** Inter/PingFang SC Medium. Used for card headers and section titles.
*   **Body (L/M/S):** Inter/PingFang SC Regular. Optimized for long lists of inventory descriptions.
*   **Label (M/S):** All-caps for Latin characters, used for metadata (e.g., "WEIGHT," "ZONE").

**Hierarchy Note:** Use `on-surface-variant` (#414752) for labels to create a clear visual distinction from the `on-surface` (#071e27) primary data.

---

### 4. Elevation & Depth: Tonal Layering
We reject traditional shadows. Instead, we use **Tonal Layering** to convey importance.

*   **The Layering Principle:** 
    *   Base Floor: `surface` (#f3faff)
    *   Sectional Blocks: `surface-container-low` (#e6f6ff)
    *   Interactive Cards: `surface-container-lowest` (#ffffff)
*   **Ambient Shadows:** For floating action buttons (FABs) or scanning overlays, use an extra-diffused shadow: `offset: 0, 12; blur: 32; color: rgba(7, 30, 39, 0.08)`. This mimics soft, overhead warehouse lighting.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-glare environments), use `outline-variant` (#c1c6d4) at **15% opacity**. Never use a 100% opaque border.

---

### 5. Components: The Industrial Suite

#### Scanning Interface (Barcode/QR)
*   **Viewport:** A large, `xl` (0.75rem) rounded corner frame. 
*   **Overlay:** Use a `surface-variant` scrim at 40% opacity. 
*   **Targeting:** Use the `secondary` (Orange) color for the scanning reticle to ensure it is visible against blue or white packaging.

#### Status Indicators (The Visibility Matrix)
*   **In Stock:** `tertiary_container` background with `on_tertiary_container` text. Roundedness: `full`.
*   **Low Stock:** `secondary_container` (Orange) background with `on_secondary_container` text. Use a pulsing animation for critical levels.
*   **Out of Stock:** `error_container` background with `on_error_container` text.

#### Data Tables & Lists
*   **No Dividers:** Forbid the use of divider lines. Separate items using `Spacing 4` (0.9rem) and subtle alternating background shifts between `surface-container` and `surface-container-low`.
*   **Scanning Motion:** When an item is scanned, the list item should transition its background to `primary_fixed` (#d4e3ff) briefly to confirm the action.

#### Interactive Inputs
*   **Input Fields:** Use a `surface-container-high` fill. When focused, shift to a `primary` "Ghost Border" (20% opacity) and move the label into a `label-sm` position.
*   **Buttons:** 
    *   **Primary:** Gradient fill (`primary` to `primary_container`), `lg` (0.5rem) roundedness.
    *   **Secondary:** Ghost style—no fill, `outline` token at 30% opacity, `on_surface` text.

---

### 6. Do's and Don'ts

**Do:**
*   **Do** use asymmetrical padding. Give more room to the top and bottom of a data cell than the sides to create a "scrolling stream" feel.
*   **Do** use the `Spacing 16` (3.5rem) or `24` (5.5rem) scales for "Danger Zones" (Delete/Void) to prevent accidental taps during fast-paced work.
*   **Do** prioritize `Plus Jakarta Sans` for SKU numbers and quantities to ensure they look "industrial" and distinct from Chinese text.

**Don't:**
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#071e27) to maintain a high-end, ink-like legibility.
*   **Don't** use cards-inside-cards. Use background color shifts to indicate nesting; double-shadowing or double-bordering is strictly prohibited.
*   **Don't** use standard "system blue." Stick to the palette’s `primary` (#005dac) which has been tuned for industrial professional-grade hardware.