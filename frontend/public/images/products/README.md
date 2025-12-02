# Product Images

This folder contains product images for the JuiceQu application.

## Structure

```
products/
├── hero/           # Hero section carousel images
│   ├── berry-blast.png
│   ├── green-goddess.png
│   └── tropical-paradise.png
├── catalog/        # Product catalog images
├── thumbnails/     # Thumbnail versions
└── README.md
```

## Production Notes

In production, product images will be stored in an external storage service (e.g., AWS S3, Google Cloud Storage, Cloudinary).

The image URLs will be constructed dynamically based on the environment:
- **Development**: `/images/products/...`
- **Production**: `https://storage.juicequ.com/images/products/...`

## Image Guidelines

- **Format**: PNG with transparent background for bottles, WEBP for optimized delivery
- **Hero Images**: 500x800px (recommended)
- **Catalog Images**: 400x600px (recommended)
- **Thumbnails**: 150x225px (recommended)
- **Max File Size**: 500KB (optimize before upload)

## Environment Configuration

Set the following environment variable for production:
```
NEXT_PUBLIC_STORAGE_URL=https://your-storage-service.com
```
