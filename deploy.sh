#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Transpile to JS
rm -rf ./dist
tsc

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

# SSH into the server and cleanup existing files
echo "🗑️ Deleting existing directory on the server..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << EOF
  rm -rf $DIRECTORY_NAME
EOF

# Rsync files to the server (excluding unnecessary files)
echo "📤 Uploading files to server..."
rsync -avz \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude 'src' \
  --exclude '.gitignore' \
  --exclude 'deploy.sh' \
  --exclude 'test-app-dev.pem' \
  --exclude 'tsconfig.json' \
  --exclude 'webpack.config.js' \
  -e "ssh -i $SSH_KEY" ./ "$SERVER_USER@$SERVER_IP:~/$DIRECTORY_NAME"

echo "✅ Upload successful!"
