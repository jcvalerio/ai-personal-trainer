# =============================================================================
# AI Personal Trainer - Makefile
# Simplified commands for common development tasks
# =============================================================================

.PHONY: help dev build start test clean deploy setup install check fix troubleshoot

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
BLUE := \033[34m
RESET := \033[0m

# Default target
.DEFAULT_GOAL := help

help: ## 📋 Show this help message
	@echo "$(BLUE)🏋️ AI Personal Trainer - Development Commands$(RESET)"
	@echo "=================================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start:$(RESET)"
	@echo "  1. make setup       # First-time setup"
	@echo "  2. make dev         # Start development"
	@echo "  3. make check       # Validate everything"
	@echo "  4. make deploy      # Deploy to preview"
	@echo ""

# =============================================================================
# 🚀 Development Commands
# =============================================================================

dev: ## 🚀 Start development server
	@echo "$(BLUE)Starting development server...$(RESET)"
	pnpm dev

build: ## 🏗️ Build the application
	@echo "$(BLUE)Building application...$(RESET)"
	pnpm build

start: ## ▶️ Start production server locally
	@echo "$(BLUE)Starting production server...$(RESET)"
	pnpm start

# =============================================================================
# 🧪 Testing & Validation Commands
# =============================================================================

test: ## 🧪 Run all tests
	@echo "$(BLUE)Running tests...$(RESET)"
	pnpm test:e2e

test-ui: ## 🧪 Run tests with UI
	@echo "$(BLUE)Running tests with UI...$(RESET)"
	pnpm test:e2e:ui

check: ## ✅ Run all quality checks
	@echo "$(BLUE)Running quality checks...$(RESET)"
	pnpm quick:check

fix: ## 🔧 Fix linting and formatting issues
	@echo "$(BLUE)Fixing code issues...$(RESET)"
	pnpm quick:fix

# =============================================================================
# 🛠️ Setup & Environment Commands
# =============================================================================

setup: ## 🛠️ Complete first-time setup
	@echo "$(BLUE)Running first-time setup...$(RESET)"
	@echo "$(YELLOW)This will install dependencies, setup database, and validate environment$(RESET)"
	pnpm setup:first-time

install: ## 📦 Install dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	pnpm install

env-setup: ## 📋 Setup environment file
	@if [ ! -f .env.local ]; then \
		echo "$(YELLOW)Creating .env.local from .env.example...$(RESET)"; \
		cp .env.example .env.local; \
		echo "$(GREEN)✅ .env.local created! Please edit it with your values.$(RESET)"; \
	else \
		echo "$(GREEN)✅ .env.local already exists$(RESET)"; \
	fi

env-validate: ## 🔍 Validate environment variables
	@echo "$(BLUE)Validating environment...$(RESET)"
	pnpm env:validate

troubleshoot: ## 🏥 Run troubleshooting diagnostics
	@echo "$(BLUE)Running troubleshooting diagnostics...$(RESET)"
	pnpm troubleshoot

# =============================================================================
# 🗄️ Database Commands
# =============================================================================

db-setup: ## 🗄️ Setup database
	@echo "$(BLUE)Setting up database...$(RESET)"
	pnpm db:setup

db-check: ## 🔍 Check database connection
	@echo "$(BLUE)Checking database connection...$(RESET)"
	pnpm db:check

db-migrate: ## ⚡ Run database migrations
	@echo "$(BLUE)Running database migrations...$(RESET)"
	pnpm db:migrate

# =============================================================================
# 🚀 Deployment Commands
# =============================================================================

deploy: ## 🚀 Deploy to preview
	@echo "$(BLUE)Deploying to preview...$(RESET)"
	pnpm deploy

deploy-prod: ## 🌟 Deploy to production
	@echo "$(BLUE)Deploying to production...$(RESET)"
	@echo "$(YELLOW)⚠️  This will deploy to PRODUCTION. Are you sure?$(RESET)"
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ]
	pnpm deploy:production

ready: ## ✅ Check if ready for deployment
	@echo "$(BLUE)Checking deployment readiness...$(RESET)"
	pnpm ready:deploy

# =============================================================================
# 🧹 Maintenance Commands
# =============================================================================

clean: ## 🧹 Clean build artifacts and cache
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	pnpm clean

clean-install: ## 🧹 Clean and reinstall dependencies
	@echo "$(BLUE)Cleaning and reinstalling dependencies...$(RESET)"
	pnpm clean:install

health: ## 🏥 Check application health
	@echo "$(BLUE)Checking application health...$(RESET)"
	pnpm health:check

# =============================================================================
# 🔄 Git & Development Workflow
# =============================================================================

git-setup: ## 🔧 Setup Git hooks
	@echo "$(BLUE)Setting up Git hooks...$(RESET)"
	pnpm prepare

status: ## 📊 Show project status
	@echo "$(BLUE)🏋️ AI Personal Trainer - Project Status$(RESET)"
	@echo "============================================"
	@echo ""
	@echo "$(YELLOW)📁 Project Structure:$(RESET)"
	@ls -la | head -10
	@echo ""
	@echo "$(YELLOW)📦 Dependencies:$(RESET)"
	@if [ -d "node_modules" ]; then \
		echo "$(GREEN)✅ node_modules exists$(RESET)"; \
	else \
		echo "$(RED)❌ node_modules missing - run 'make install'$(RESET)"; \
	fi
	@echo ""
	@echo "$(YELLOW)🔧 Environment:$(RESET)"
	@if [ -f ".env.local" ]; then \
		echo "$(GREEN)✅ .env.local exists$(RESET)"; \
	else \
		echo "$(YELLOW)⚠️  .env.local missing - run 'make env-setup'$(RESET)"; \
	fi
	@echo ""
	@echo "$(YELLOW)🏗️ Build Status:$(RESET)"
	@if [ -d ".next" ]; then \
		echo "$(GREEN)✅ .next directory exists (built)$(RESET)"; \
	else \
		echo "$(YELLOW)⚠️  Not built yet - run 'make build'$(RESET)"; \
	fi

# =============================================================================
# 🎯 Common Workflows
# =============================================================================

first-run: env-setup install setup ## 🎯 Complete first-time setup workflow
	@echo "$(GREEN)🎉 First-time setup complete!$(RESET)"
	@echo "$(YELLOW)Next steps:$(RESET)"
	@echo "1. Edit .env.local with your API keys"
	@echo "2. Run 'make dev' to start development"

quick-start: check dev ## 🎯 Quick start development (assumes setup is done)

pre-commit: check test ## 🎯 Run pre-commit checks manually

ci: check test build ## 🎯 Run full CI pipeline locally

# =============================================================================
# 📖 Documentation Commands
# =============================================================================

docs: ## 📖 Open documentation
	@echo "$(BLUE)Opening documentation...$(RESET)"
	@echo "$(YELLOW)Available documentation:$(RESET)"
	@echo "- README.md - Project overview"
	@echo "- docs/DEPLOYMENT_GUIDE.md - Deployment guide"
	@echo "- docs/DEVELOPMENT.md - Development guide"
	@echo "- DEPLOYMENT_SUMMARY.md - Deployment summary"

# =============================================================================
# 🐛 Debug Commands
# =============================================================================

debug-env: ## 🐛 Debug environment issues
	@echo "$(BLUE)Environment Debug Information:$(RESET)"
	@echo "$(YELLOW)Node.js version:$(RESET)"
	@node --version
	@echo "$(YELLOW)pnpm version:$(RESET)"
	@pnpm --version
	@echo "$(YELLOW)Environment validation:$(RESET)"
	@pnpm env:check || true

debug-build: ## 🐛 Debug build issues
	@echo "$(BLUE)Build Debug Information:$(RESET)"
	@pnpm type-check || true
	@pnpm lint || true

# =============================================================================
# 💡 Tips and Shortcuts
# =============================================================================

tips: ## 💡 Show helpful tips
	@echo "$(BLUE)💡 Helpful Tips:$(RESET)"
	@echo ""
	@echo "$(YELLOW)🚀 Quick Commands:$(RESET)"
	@echo "  make           # Show help"
	@echo "  make dev       # Start development"
	@echo "  make check     # Validate everything"
	@echo "  make fix       # Fix code issues"
	@echo ""
	@echo "$(YELLOW)🔧 Setup Commands:$(RESET)"
	@echo "  make setup     # First-time setup"
	@echo "  make env-setup # Create .env.local"
	@echo ""
	@echo "$(YELLOW)🧪 Testing:$(RESET)"
	@echo "  make test      # Run tests"
	@echo "  make test-ui   # Run tests with UI"
	@echo ""
	@echo "$(YELLOW)🚀 Deployment:$(RESET)"
	@echo "  make ready     # Check deployment readiness"
	@echo "  make deploy    # Deploy to preview"
	@echo ""
	@echo "$(YELLOW)🏥 Troubleshooting:$(RESET)"
	@echo "  make troubleshoot  # Run diagnostics"
	@echo "  make debug-env     # Debug environment"
	@echo "  make status        # Show project status"