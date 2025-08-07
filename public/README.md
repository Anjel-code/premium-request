# Media Assets Organization

This directory contains all media assets for the website, organized by content type and purpose.

## Folder Structure

### Images (`/images/`)

#### `/images/product/`
- **Purpose**: Main product images, product galleries, and product-related visuals
- **Content**: Product photos, product detail images, product variations
- **Formats**: JPG, PNG, WebP
- **Recommended sizes**: 800x800px (main), 400x400px (thumbnails)

#### `/images/reviews/`
- **Purpose**: Product images shown in customer reviews
- **Content**: Images of products being reviewed by customers
- **Formats**: JPG, PNG
- **Recommended sizes**: 400x300px

#### `/images/profiles/`
- **Purpose**: Customer profile pictures and avatars
- **Content**: User profile images, customer avatars in reviews
- **Formats**: JPG, PNG
- **Recommended sizes**: 150x150px (circular/square)

#### `/images/hero/`
- **Purpose**: Hero section images and banners
- **Content**: Main banner images, hero backgrounds, promotional visuals
- **Formats**: JPG, PNG, WebP
- **Recommended sizes**: 1920x1080px (desktop), 768x1024px (mobile)

#### `/images/backgrounds/`
- **Purpose**: Background images for various sections
- **Content**: Section backgrounds, decorative backgrounds, texture images
- **Formats**: JPG, PNG
- **Recommended sizes**: 1920x1080px or larger

#### `/images/icons/`
- **Purpose**: Custom icons and small graphics
- **Content**: Custom icons, badges, small decorative elements
- **Formats**: SVG, PNG
- **Recommended sizes**: 16x16px to 64x64px

#### `/images/thumbnails/`
- **Purpose**: Thumbnail images for videos and galleries
- **Content**: Video thumbnails, gallery thumbnails, preview images
- **Formats**: JPG, PNG
- **Recommended sizes**: 320x240px

### Videos (`/videos/`)

#### `/videos/product/`
- **Purpose**: Product demonstration videos
- **Content**: Product showcases, feature demonstrations, unboxing videos
- **Formats**: MP4, WebM
- **Recommended specs**: 1080p, H.264 codec, <50MB

#### `/videos/reviews/`
- **Purpose**: Customer testimonial videos
- **Content**: Video reviews, customer testimonials, user-generated content
- **Formats**: MP4, WebM
- **Recommended specs**: 720p, H.264 codec, <30MB

## File Naming Convention

### Images
- Use descriptive, lowercase names with hyphens
- Include dimensions in filename for multiple sizes
- Example: `headphones-main-800x800.jpg`, `headphones-thumb-400x400.jpg`

### Videos
- Use descriptive, lowercase names with hyphens
- Include quality indicator if multiple versions exist
- Example: `headphones-demo-1080p.mp4`, `customer-review-720p.mp4`

## Usage Guidelines

### Performance Optimization
- Compress images before uploading (use tools like TinyPNG)
- Use WebP format when possible for better compression
- Optimize videos for web streaming
- Consider lazy loading for images below the fold

### Accessibility
- Provide alt text for all images
- Ensure sufficient color contrast
- Use descriptive filenames
- Include captions for important images

### Responsive Design
- Provide multiple image sizes for different screen sizes
- Use appropriate image formats for different devices
- Consider using `srcset` for responsive images

## Admin Upload Guidelines

When uploading media through the admin interface:

1. **Product Images**: Upload to `/images/product/`
2. **Review Images**: Upload to `/images/reviews/`
3. **Profile Pictures**: Upload to `/images/profiles/`
4. **Video Thumbnails**: Upload to `/images/thumbnails/`
5. **Product Videos**: Upload to `/videos/product/`
6. **Review Videos**: Upload to `/videos/reviews/`

## Storage Management

- Monitor file sizes to prevent storage quota issues
- Regularly clean up unused media files
- Use appropriate compression for different content types
- Consider implementing a CDN for better performance

## Current Files

- `hero-background.jpg` → Moved to `/images/backgrounds/`
- `favicon.ico` → Root level (browser requirement)
- `placeholder.svg` → Root level (fallback image)
- `robots.txt` → Root level (SEO requirement) 