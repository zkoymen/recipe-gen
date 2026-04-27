---
name: Design System
colors:
  surface: '#fdf9f3'
  surface-dim: '#dddad4'
  surface-bright: '#fdf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ed'
  surface-container: '#f1ede7'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e6e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#3e4944'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0ea'
  outline: '#6e7a74'
  outline-variant: '#bdc9c2'
  surface-tint: '#006c52'
  primary: '#006c52'
  on-primary: '#ffffff'
  primary-container: '#98ffd9'
  on-primary-container: '#00785c'
  inverse-primary: '#73d9b5'
  secondary: '#79573f'
  on-secondary: '#ffffff'
  secondary-container: '#ffd1b3'
  on-secondary-container: '#7a5840'
  tertiary: '#5c5d6e'
  on-tertiary: '#ffffff'
  tertiary-container: '#eaeafe'
  on-tertiary-container: '#67697a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8ff6d0'
  primary-fixed-dim: '#73d9b5'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513d'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#eabea0'
  on-secondary-fixed: '#2d1604'
  on-secondary-fixed-variant: '#5f402a'
  tertiary-fixed: '#e1e1f5'
  tertiary-fixed-dim: '#c5c5d8'
  on-tertiary-fixed: '#191b29'
  on-tertiary-fixed-variant: '#444655'
  background: '#fdf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e6e2dc'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The brand personality of this design system is whimsical, approachable, and joy-filled, designed to transform the daily chore of meal planning into a delightful creative outlet. It targets home cooks who value inspiration and ease over clinical precision.

The design style is **Soft Tactile**. It leans into a friendly, "squishy" aesthetic that avoids the coldness of traditional flat design. By combining generous whitespace with organic shapes and subtle depth, the UI evokes the feeling of a modern, well-curated kitchen scrapbook. Every interaction is designed to feel bouncy and responsive, reinforcing a sense of culinary playfulness.

## Colors

The palette is built on a foundation of culinary-inspired pastels. **Mint** (Primary) serves as the main action color, representing freshness. **Peach** (Secondary) and **Lavender** (Tertiary) are used for categorization and soft decorative elements. 

The neutral base is a warm, creamy off-white rather than a stark grey, ensuring the interface feels "homey." For high-visibility moments, **Cherry Red** is reserved for destructive actions or urgent alerts, while **Sunny Yellow** is used for highlights, ratings, and "spark" moments. All colors should maintain a high enough contrast against the cream background to ensure accessibility while remaining soft on the eyes.

## Typography

This design system utilizes **Plus Jakarta Sans** for all headings to take advantage of its soft, rounded terminals and optimistic character. It should be typeset with tight letter-spacing in larger sizes to emphasize its "bubbly" nature.

For body copy and functional text, **Be Vietnam Pro** is used. Its clean, contemporary letterforms ensure maximum legibility for long ingredient lists and cooking instructions. Weight is used strategically to create hierarchy: extra-bold for titles and medium-to-semibold for labels to ensure they stand out against the soft pastel backgrounds.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy, centering content within a generous 1200px container to maintain an organized, cookbook-like feel. The spacing rhythm is based on an 8px modular scale, but padding within components (like cards and buttons) should be intentionally "airy" to avoid a cramped appearance.

Margins and gutters are wider than standard utility-focused apps to allow the pastel colors and whimsical illustrations room to breathe. Use "Stack" spacing for vertical rhythm: 12px for related items, 24px for section breaks, and 48px for major content transitions.

## Elevation & Depth

Depth in this design system is achieved through **Ambient Shadows** that are tinted with the primary or neutral colors, rather than neutral greys. Shadows should be extremely diffused (large blur radius) and low-opacity, creating a "floating" effect rather than a "hovering" one.

Surfaces use a tiered approach:
- **Level 0 (Background):** The cream neutral base.
- **Level 1 (Cards):** Soft pastel surfaces with a subtle 4px blur shadow.
- **Level 2 (Interactive):** Bubbly elements like buttons that use a slightly deeper, more saturated shadow to suggest they can be "pressed" down.

Avoid hard borders or high-contrast dividers; use subtle shifts in background color (e.g., a Lavender section on a Cream background) to define boundaries.

## Shapes

The shape language is defined by high-radius curves and organic forms. The base **Roundedness (2)** applies to standard cards and containers. However, interactive elements like buttons and tags should often use "Pill" shapes (maximum border-radius) to emphasize the bubbly, friendly aesthetic.

Avoid sharp 90-degree angles entirely. Even small elements like checkboxes or input focus states should maintain a minimum of 4px-8px radius. Illustrations should favor "blob" shapes and hand-drawn, slightly imperfect lines to reinforce the whimsical brand personality.

## Components

### Buttons
Buttons are the primary expression of the "bubbly" style. They should feature a pill-shape, bold typography, and a "thick" bottom shadow (3px-4px) in a slightly darker shade of the button's color to create a tactile, pressable look. Upon hover, the button should scale up slightly (1.05x).

### Cards
Cards use the **Rounded (2)** setting and should be background-filled with soft pastels. To keep the UI light, use a "ghost" border (1px solid, 10% opacity of the card's theme color) instead of heavy shadows.

### Inputs & Search
Fields should have a soft peach or mint background with 0% border, turning into a 2px vibrant stroke of the same color when focused. Use large, friendly icons (e.g., a hand-drawn magnifying glass) within the input area.

### Chips & Tags
Used for dietary labels (e.g., "Vegan," "Gluten-Free"). These should be pill-shaped with a light tint of the primary color and dark-colored text.

### Hand-drawn Illustrations
Incorporate whimsical icons for cooking time, serving size, and difficulty levels. These should look like ink-sketches with slight overflows or "off-register" color fills to maintain the playful, human-centric feel of the design system.