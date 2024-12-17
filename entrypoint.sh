#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Set default port if not provided
export PORT=${PORT:-8000}

# Apply database migrations
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "Failed to apply database migrations. Exiting..."
    exit 1
}

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || {
    echo "Failed to collect static files. Exiting..."
    exit 1
}

# Create necessary directories for static and media files
echo "Ensuring directories exist for static and media files..."
mkdir -p /app/staticfiles /app/media

# Start Gunicorn server
echo "Starting Gunicorn server on port ${PORT}..."
exec gunicorn --config gunicorn-cfg.py --bind 0.0.0.0:${PORT} config.wsgi
