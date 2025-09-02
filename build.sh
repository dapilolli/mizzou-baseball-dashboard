#!/usr/bin/env bash
# Build script for Render

echo "🐅 Building Mizzou Baseball Analytics API..."

# Install dependencies
echo "📋 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🎉 Build completed successfully!"
