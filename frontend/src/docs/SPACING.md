# Spacing System Guide

This document outlines our standardized spacing system using Tailwind CSS's spacing scale. Following these guidelines will ensure consistent spacing throughout the application.

## Spacing Scale

We use Tailwind's default spacing scale. The primary spacing values to use are:

| Class | Value | Rem | Pixels |
|-------|-------|-----|--------|
| 0     | 0     | 0   | 0px    |
| px    | 1px   | -   | 1px    |
| 0.5   | 0.125rem | 0.125 | 2px |
| 1     | 0.25rem | 0.25 | 4px  |
| 2     | 0.5rem  | 0.5  | 8px  |
| 3     | 0.75rem | 0.75 | 12px |
| 4     | 1rem    | 1    | 16px |
| 5     | 1.25rem | 1.25 | 20px |
| 6     | 1.5rem  | 1.5  | 24px |
| 8     | 2rem    | 2    | 32px |
| 10    | 2.5rem  | 2.5  | 40px |
| 12    | 3rem    | 3    | 48px |
| 16    | 4rem    | 4    | 64px |
| 20    | 5rem    | 5    | 80px |
| 24    | 6rem    | 6    | 96px |

## Usage Guidelines

### Margins

- Use `mb-4` (16px) for basic paragraph spacing
- Use `mb-6` (24px) for section headings
- Use `mb-8` (32px) for major section separations
- Use `mt-4` (16px) for spacing after elements
- Use `my-6` (24px) for vertical rhythm between related content
- Use `mx-auto` for centering with fixed width

### Padding

- Use `p-4` (16px) for card and container basic padding
- Use `p-6` (24px) for more spacious containers
- Use `p-8` (32px) for hero sections and featured content
- Use `px-4 md:px-6` for responsive horizontal padding
- Use `py-12` (48px) for major vertical section padding

### Gaps

- Use `gap-2` (8px) for tight groupings (e.g., button groups)
- Use `gap-4` (16px) for standard form elements
- Use `gap-6` (24px) for related content sections
- Use `gap-8` (32px) for major content divisions

### Layout Spacing

- Use `space-y-2` for tight vertical spacing
- Use `space-y-4` for standard vertical spacing
- Use `space-y-6` for more generous vertical spacing
- Use `space-x-2` for tight horizontal spacing
- Use `space-x-4` for standard horizontal spacing

## Container Padding

The container component has the following padding:
```js
container: {
  padding: {
    DEFAULT: '1rem',   // 16px
    sm: '1.5rem',      // 24px
    lg: '2rem',        // 32px
  },
}
```

## Responsive Considerations

- Use smaller spacing values on mobile:
  - `px-4 md:px-6 lg:px-8`
  - `py-8 md:py-12 lg:py-16`
  - `gap-4 md:gap-6 lg:gap-8`

## Best Practices

1. Always use the defined spacing values from the scale
2. Avoid arbitrary values like `mt-[13px]` or `p-[45px]`
3. Use responsive variants for different screen sizes
4. Maintain consistent rhythm within page sections
5. Use gap and space utilities for related content 