#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load values from .env
env=$1

if [ -z "$env" ]; then
  echo "Error: No environment specified. Usage: $0 <development|production>"
  exit 1
fi

if [ "$env" = "development" ]; then
  source .env.development
elif [ "$env" = "production" ]; then
  source .env.production
else
  echo "Error: Invalid environment specified. Only 'development' or 'production' are allowed."
  exit 1
fi

echo "🔧 Setting up the application on the server..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Stop any existing PM2 process for the app
echo "🛑 Stopping existing PM2 process..."
pm2 kill
pm2 flush
pm2 save --force

# Start the app with PM2
echo "🔥 Starting application with PM2..."
ENV=$env pm2 start $APP_ENTRY
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -n 1 | bash
pm2 save

echo "✅ PM2 started successfully!"

# Start NGROK
echo "🔥 Starting NGROK with PM2..."
pm2 start "ngrok http --url=$NGROK_STATIC_DOMAIN $PUBLIC_IPv4_ADDRESS" --name ngrok
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -n 1 | bash
pm2 save

echo "✅ NGROK started successfully!"
