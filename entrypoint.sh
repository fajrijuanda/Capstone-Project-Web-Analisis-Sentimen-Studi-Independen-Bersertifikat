#!/bin/sh

# Apply database migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn
echo "Starting Gunicorn..."
gunicorn --config gunicorn-cfg.py --bind 0.0.0.0:${PORT} config.wsgi
