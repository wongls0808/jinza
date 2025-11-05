# Brand Logos Setup Guide

## Footer Brand Showcase

The footer now features a brand showcase section to display all the brands you distribute.

### Required Brand Logo Files:

Place the following logo files in the `images` folder:

1. **3trees-logo.png** - 3TREES brand logo
2. **brand2-logo.png** - Your second brand logo
3. **brand3-logo.png** - Your third brand logo
4. **brand4-logo.png** - Your fourth brand logo

### Logo Specifications:

**Format:** PNG with transparent background (recommended)
**Size:** Maximum 300x100px (width x height)
**Aspect Ratio:** Maintain original brand proportions
**Color:** Use original brand colors (will display as-is)
**Background:** Transparent or white background
**File Size:** Keep under 100KB each

### Visual Effect:

- All logos display in their original colors
- Shown on white/light semi-transparent cards
- Hover effect: slight lift, shadow increase, and full white background
- Responsive grid layout

### Layout:

- **Desktop:** 4 logos in one row
- **Tablet:** 2 logos per row
- **Mobile:** 1 logo per row (stacked)

### How to Add More Brands:

If you need to add more than 4 brands, edit `index.html`:

1. Find the `<div class="brand-logos">` section in the footer
2. Copy and paste this block:

```html
<div class="brand-logo-item">
    <img src="images/brand5-logo.png" alt="Brand 5">
</div>
```

3. Update the filename and alt text
4. Save the corresponding logo file in the `images` folder

### How to Add Fewer Brands:

If you only have 3 brands or fewer:

1. Open `index.html`
2. Remove the extra `<div class="brand-logo-item">` blocks you don't need
3. The layout will automatically adjust

### Brand Information Update:

Don't forget to also update:

1. **Footer Links** - Update the brand names under "Our Brands" section
2. **Social Media** - Add brand-specific social media links if needed
3. **Brand URLs** - Link each logo to the respective brand website

### Example Brand Logos to Use:

For 3TREES logo, you can:
- Download from https://www.3treesgroup.com/
- Request official logo from your brand representative
- Use the provided brand guidelines

### Placeholder Solution:

If you don't have all brand logos yet:
- The current placeholders will display as empty white cards
- You can add text-only brand names temporarily
- Or use simple text-based logos

### CSS Customization:

To adjust logo sizes, edit `css/style.css`:

```css
.brand-logo-item img {
    max-height: 60px;  /* Change this value */
}
```

To change the number of columns:

```css
.brand-logos {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    /* Change 150px to adjust minimum card width */
}
```

---

**Tip:** Keep all brand logos in a consistent style (all white, all color, etc.) for a cohesive look.
