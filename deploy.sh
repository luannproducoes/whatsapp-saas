#!/bin/bash

# WhatsApp SaaS Deploy Script for Hetzner VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check if required env vars are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file"
    exit 1
fi

# Build and start containers
echo "📦 Building Docker containers..."
docker compose build

echo "🔄 Stopping old containers..."
docker compose down

echo "🚀 Starting new containers..."
docker compose up -d

echo "🔍 Checking container status..."
docker compose ps

echo "📊 Showing logs (last 50 lines)..."
docker compose logs --tail=50

echo "✅ Deployment complete!"
echo ""
echo "📌 Your application is running at:"
echo "   Frontend: http://your-server-ip"
echo "   Backend API: http://your-server-ip/api"
echo ""
echo "📝 To view logs: docker compose logs -f"
echo "🔄 To restart: docker compose restart"
echo "🛑 To stop: docker compose down"