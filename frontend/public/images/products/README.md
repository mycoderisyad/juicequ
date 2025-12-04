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

In production, product images are stored on the **local VPS server** (same server as the application).
This approach is **cost-effective** for small businesses that don't need expensive cloud storage services.

The image URLs will be constructed dynamically based on the environment:
- **Development**: `/images/products/...` (Next.js public folder)
- **Production**: `http://your-backend-url/uploads/products/...` (FastAPI static files)

## Storage Architecture

```
VPS Server
├── Backend (FastAPI)
│   └── /uploads/           <- Uploaded files stored here
│       ├── products/
│       │   ├── hero/
│       │   ├── catalog/
│       │   └── thumbnails/
│       └── users/
└── Frontend (Next.js)
    └── /public/images/     <- Development only
```

## Image Guidelines

- **Format**: PNG with transparent background for bottles, WEBP for optimized delivery
- **Hero Images**: 500x800px (recommended)
- **Catalog Images**: 400x600px (recommended)
- **Thumbnails**: 150x225px (recommended)
- **Max File Size**: 10MB (configurable via UPLOAD_MAX_SIZE_MB)

## Environment Configuration

```bash
# Backend (.env)
UPLOAD_BASE_PATH=./uploads
UPLOAD_MAX_SIZE_MB=10
UPLOAD_ALLOWED_EXTENSIONS=jpg,jpeg,png,webp,gif

# Frontend (.env.local) - Optional for production
NEXT_PUBLIC_STORAGE_URL=http://your-backend-url
```

## Upload API

Images can be uploaded via the API:
```
POST /api/v1/upload/image
POST /api/v1/upload/product-image
```

See API documentation at `/docs` for details.
