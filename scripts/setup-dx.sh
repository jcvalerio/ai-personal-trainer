#!/bin/bash

# AI Personal Trainer - Development Experience Setup
# This script sets up the optimized development workflow

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}${1}${NC}"
}

print_header() {
  echo ""
  echo -e "${PURPLE}================================${NC}"
  echo -e "${PURPLE}$1${NC}"
  echo -e "${PURPLE}================================${NC}"
  echo ""
}

print_header "🚀 AI Personal Trainer - DX Setup"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_status "❌ Error: package.json not found. Make sure you're in the project root." $RED
  exit 1
fi

print_header "📦 Installing Dependencies"
print_status "Installing development dependencies..." $YELLOW
pnpm install

print_header "🔧 Setting up Git Hooks"
print_status "Initializing Husky hooks..." $YELLOW
if [ -d ".git" ]; then
  pnpm husky install
  chmod +x .husky/pre-commit
  print_status "✅ Git hooks configured" $GREEN
else
  print_status "⚠️ Not a git repository. Husky hooks skipped." $YELLOW
fi

print_header "🧹 Code Quality Setup"
print_status "Running initial code formatting..." $YELLOW
pnpm format || print_status "⚠️ Some files couldn't be formatted" $YELLOW

print_status "Fixing linting issues..." $YELLOW
pnpm lint:fix || print_status "⚠️ Some linting issues need manual attention" $YELLOW

print_header "🔍 TypeScript Configuration"
print_status "Checking TypeScript configuration..." $YELLOW
if pnpm type-check; then
  print_status "✅ TypeScript configuration is valid" $GREEN
else
  print_status "⚠️ TypeScript issues detected. Run 'pnpm type-check' to see details." $YELLOW
fi

print_header "🌐 Environment Setup"
print_status "Validating environment configuration..." $YELLOW
if pnpm env:validate; then
  print_status "✅ Environment configuration is valid" $GREEN
else
  print_status "⚠️ Environment configuration needs attention. Run 'pnpm env:check' for details." $YELLOW
fi

print_header "📊 Development Scripts Overview"
echo ""
print_status "🚀 Main Development Commands:" $CYAN
echo "  pnpm dev              - Start Next.js development server"
echo "  pnpm dev:watch        - Start dev server with type checking and linting in watch mode"
echo ""
print_status "🔍 Code Quality Commands:" $CYAN
echo "  pnpm validate         - Run type checking, linting, and format checking"
echo "  pnpm validate:fix     - Run validation with auto-fixing"
echo "  pnpm validate:watch   - Run validation in watch mode"
echo "  pnpm validate:notify  - Run validation with system notifications"
echo ""
print_status "🧰 Individual Tool Commands:" $CYAN
echo "  pnpm type-check       - TypeScript type checking"
echo "  pnpm type-check:watch - TypeScript type checking in watch mode"
echo "  pnpm lint             - ESLint checking"
echo "  pnpm lint:watch       - ESLint checking in watch mode"
echo "  pnpm format           - Format code with Prettier"
echo "  pnpm format:watch     - Format code in watch mode"
echo ""
print_status "🚀 DX Commands:" $CYAN
echo "  pnpm dx:setup         - Initialize development environment"
echo "  pnpm dx:check         - Quick code quality check"
echo "  pnpm dx:fix           - Fix code issues automatically"
echo ""

print_header "🎯 VS Code Integration"
print_status "VS Code tasks available (Cmd+Shift+P → 'Tasks: Run Task'):" $CYAN
echo "  - 👀 Development Watch Mode"
echo "  - 🔍 Validation Watch Mode"
echo "  - ✅ Code Quality Check"
echo "  - 🧹 Lint & Format"
echo "  - 🚀 DX Setup"
echo ""

print_header "🔔 Notifications Setup"
print_status "System notifications are configured for validation results" $CYAN
print_status "Use 'pnpm validate:notify' to get sound/visual feedback" $CYAN
echo ""

print_header "⚡ Performance Tips"
print_status "• Use 'pnpm dev:watch' for comprehensive development mode" $BLUE
print_status "• Enable 'Format on Save' in VS Code for automatic formatting" $BLUE
print_status "• Use 'pnpm validate:watch' during intensive coding sessions" $BLUE
print_status "• Pre-commit hooks will automatically run validation checks" $BLUE
echo ""

print_header "🎉 Setup Complete!"
print_status "Your development environment is now optimized!" $GREEN
print_status "Start developing with: pnpm dev:watch" $GREEN
print_status "For questions, run: pnpm troubleshoot" $CYAN
echo ""