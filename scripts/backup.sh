#!/bin/bash
# ===========================================
# JuiceQu - Backup Script
# ===========================================
# Backs up PostgreSQL database and uploaded files

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Database connection
DB_HOST="db"
DB_NAME="${POSTGRES_DB:-juicequ}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "=== JuiceQu Backup Script ==="
echo "Date: $(date)"
echo "Retention: ${RETENTION_DAYS} days"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}/db"
mkdir -p "${BACKUP_DIR}/uploads"

# ===========================================
# Database Backup
# ===========================================
echo ""
echo ">>> Backing up database..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -F c \
    -f "${BACKUP_DIR}/db/juicequ_${DATE}.dump"

echo "Database backup saved: ${BACKUP_DIR}/db/juicequ_${DATE}.dump"

# ===========================================
# Uploads Backup
# ===========================================
echo ""
echo ">>> Backing up uploads..."

if [ -d "/uploads" ] && [ "$(ls -A /uploads 2>/dev/null)" ]; then
    tar -czf "${BACKUP_DIR}/uploads/uploads_${DATE}.tar.gz" -C /uploads .
    echo "Uploads backup saved: ${BACKUP_DIR}/uploads/uploads_${DATE}.tar.gz"
else
    echo "No uploads to backup"
fi

# ===========================================
# Cleanup Old Backups
# ===========================================
echo ""
echo ">>> Cleaning up old backups (older than ${RETENTION_DAYS} days)..."

# Remove old database backups
find "${BACKUP_DIR}/db" -name "*.dump" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Remove old uploads backups
find "${BACKUP_DIR}/uploads" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

echo "Cleanup complete"

# ===========================================
# Summary
# ===========================================
echo ""
echo "=== Backup Summary ==="
echo "Database backups:"
ls -lh "${BACKUP_DIR}/db/" 2>/dev/null || echo "  No backups found"
echo ""
echo "Uploads backups:"
ls -lh "${BACKUP_DIR}/uploads/" 2>/dev/null || echo "  No backups found"
echo ""
echo "Backup completed successfully!"
