# 3TREES Group Official Website - Malaysia

A modern, responsive corporate showcase website for 3TREES Group's authorized distributor in Malaysia.

## About 3TREES

Founded in 2002, SKSHU Paint Co., Ltd. (3TREES) is committed to creating a better life and healthier living environment for humanity. Listed on the Shanghai Stock Exchange A-share main board in 2016, with a brand value of 33.155 billion yuan in 2021, 3TREES is a leading coating company among China's top 500 private enterprises.

**This website is operated by the authorized distributor for Malaysia.**

## Key Features

✨ **Core Features**
- 🎨 Modern design with stunning visual effects
- 📱 Fully responsive, supports all devices
- 🔄 Automatic carousel slider
- ✨ Smooth scrolling animations
- 🎯 Clear navigation structure
- 📧 Contact form functionality
- 🌍 English language interface

## Website Structure

```
jinza web/
├── index.html          # Main page (English)
├── css/
│   └── style.css      # Stylesheet
├── js/
│   └── script.js      # JavaScript interactions
├── images/            # Image resources folder
│   ├── jinza-logo.png # Company logo
│   └── README.md      # Image documentation
├── videos/            # Video resources folder
│   ├── hero-video.mp4 # Background video (add your video here)
│   └── README.md      # Video setup guide
└── README.md          # This document
```

## Page Sections

1. **Navigation Bar** - Fixed top navigation with JINZA logo and main links
2. **Hero Section with Video Background** - Full-screen auto-playing video with text overlays
3. **Star Products** - Four product showcase cards
4. **At Your Service** - Core service features
5. **About 3TREES** - Company introduction and corporate image
6. **Corporate Culture** - Cultural philosophy display
7. **Corporate Social Responsibility** - CSR and statistics
8. **Latest News** - News article cards
9. **Contact Us** - Contact information and form
10. **Footer** - JINZA logo, quick links and social media

## Quick Start

### Open Directly

1. **Direct Open**
   - Double-click the `index.html` file to open in browser

2. **Using Local Server (Recommended)**
   ```bash
   # If Python 3 is installed
   python -m http.server 8000
   
   # If Python 2 is installed
   python -m SimpleHTTPServer 8000
   
   # If Node.js and http-server are installed
   npx http-server
   ```
   Then visit `http://localhost:8000` in your browser

3. **Using VS Code Live Server**
   - Install Live Server extension
   - Right-click `index.html` and select "Open with Live Server"

### Customization

1. **Update Company Information**
   - Open `index.html`
   - Update contact information, addresses, etc.
   - Modify product descriptions as needed

2. **Replace Images**
   - Place your images in the `images` folder
   - Refer to `images/README.md` for required images
   - Your JINZA logo should be saved as `jinza-logo.png`

3. **Add Background Video**
   - Place your video file in the `videos` folder
   - Name it `hero-video.mp4` (and optionally `hero-video.webm`)
   - Recommended: 1920x1080, under 10MB, 10-30 seconds
   - See `videos/README.md` for detailed video specifications
   - Video will autoplay, loop, and mute automatically

4. **Change Color Theme**
   - Open `css/style.css`
   - Modify CSS variables in `:root`
   ```css
   :root {
       --primary-color: #667eea;    /* Primary color */
       --secondary-color: #764ba2;  /* Secondary color */
       --accent-color: #f093fb;     /* Accent color */
   }
   ```

4. **Add More Content**
   - Copy existing section structures in HTML
   - Adjust content and styles as needed

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling and animations
  - Flexbox and Grid layout
  - CSS variables
  - Gradients and transitions
- **JavaScript (ES6+)** - Interactive features
  - Slider control
  - Scroll animations
  - Form handling
  - Intersection Observer API
- **Font Awesome 6** - Icon library

## Browser Compatibility

✅ Chrome (Latest)
✅ Firefox (Latest)
✅ Safari (Latest)
✅ Edge (Latest)
⚠️ IE11 (Some features may not be supported)

## Responsive Breakpoints

- 📱 Mobile: < 480px
- 📱 Large Mobile/Tablet: 481px - 768px
- 💻 Tablet/Small Desktop: 769px - 968px
- 🖥️ Desktop: > 968px

## Performance Optimization Tips

1. **Image Optimization**
   - Compress all images (recommend using TinyPNG)
   - Use appropriate image formats (JPEG/PNG/WebP)
   - Consider using lazy loading

2. **Code Optimization**
   - Minify CSS and JavaScript (production)
   - Load external libraries from CDN
   - Enable browser caching

3. **Loading Speed**
   - Optimize font loading
   - Reduce HTTP requests
   - Use async loading

## Deployment

### GitHub Pages
1. Push files to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select main branch as source

### Netlify
1. Drag and drop project to Netlify
2. Or connect Git repository for automatic deployment

### Traditional Server
1. Upload all files to server
2. Ensure server supports static file hosting
3. Configure domain and SSL certificate

## Future Development Suggestions

- [ ] Add multi-language support (Chinese/English toggle)
- [ ] Integrate backend API (form submission, data management)
- [ ] Add more pages (product details, news details, etc.)
- [ ] SEO optimization (meta tags, sitemap)
- [ ] Add live chat functionality
- [ ] Integrate analytics tools (Google Analytics)

## Important Note

**This website is operated by the authorized distributor of 3TREES Group for Malaysia. All content related to 3TREES brand is used with proper authorization.**

## Contact

For inquiries about 3TREES products in Malaysia, please use the contact form on the website or reach out through the provided contact information.

---

**Last Updated:** November 5, 2025
**Version:** 1.0.0
**Authorized Distributor:** Malaysia Region
