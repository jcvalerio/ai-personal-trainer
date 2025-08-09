#!/bin/bash

# AI Personal Trainer - Development Setup Script
# This script sets up the development environment for new contributors

set -e

echo "🚀 Setting up AI Personal Trainer development environment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.17.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_NODE'))" 2>/dev/null; then
    echo "⚠️  Warning: Node.js $REQUIRED_NODE or higher is recommended"
    echo "   Current version: $NODE_VERSION"
    echo "   Consider updating with: https://nodejs.org/"
    echo ""
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo ""

# Copy environment file
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env.local
    echo "✅ Created .env.local from template"
    echo "   Please update the environment variables with your actual values"
    echo ""
else
    echo "✅ Environment file already exists"
    echo ""
fi

# Run type checking
echo "🔍 Running type check..."
pnpm type-check
echo ""

# Run linting
echo "🧹 Running linter..."
pnpm lint
echo ""

# Test the build
echo "🔨 Testing build process..."
pnpm build
echo ""

# Success message
echo "✅ Setup complete! Here's what you can do next:"
echo ""
echo "   📝 Update your .env.local file with actual API keys"
echo "   🚀 Start development server: pnpm dev"
echo "   🧪 Run tests: pnpm test"
echo "   🎨 Format code: pnpm format"
echo "   📊 Analyze bundle: pnpm analyze"
echo ""
echo "   📖 Check out the docs/ directory for more information"
echo "   🐛 Found a bug? Create an issue on GitHub"
echo ""
echo "Happy coding! 💪"