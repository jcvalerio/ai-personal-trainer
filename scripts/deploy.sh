#!/bin/bash

# ==============================================
# AI Personal Trainer - Deployment Script
# ==============================================
# Intelligent deployment script with validation and health checks
# Usage: ./scripts/deploy.sh [environment]
# Environment: preview (default) | production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-preview}
PROJECT_NAME="ai-personal-trainer"
HEALTH_CHECK_URL=""
MAX_RETRIES=5
RETRY_DELAY=10

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check required commands
    if ! command_exists "vercel"; then
        log_error "Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi
    
    if ! command_exists "pnpm"; then
        log_error "pnpm not found. Install with: npm i -g pnpm"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
        log_error "Must run from project root directory"
        exit 1
    fi
    
    # Validate package.json
    if ! pnpm validate:env 2>/dev/null; then
        log_warning "Environment validation script not found or failed"
        log_info "Continuing with deployment..."
    fi
    
    log_success "Environment validation passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if user is logged in to Vercel
    if ! vercel whoami >/dev/null 2>&1; then
        log_error "Not logged in to Vercel. Run: vercel login"
        exit 1
    fi
    
    # Run type checking
    log_info "Running TypeScript checks..."
    if ! pnpm type-check; then
        log_error "TypeScript check failed"
        exit 1
    fi
    
    # Run linting
    log_info "Running linting..."
    if ! pnpm lint; then
        log_error "Linting failed"
        exit 1
    fi
    
    # Build locally to catch build errors early
    log_info "Testing local build..."
    if ! pnpm build; then
        log_error "Local build failed"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel ($ENVIRONMENT)..."
    
    local deploy_flags=""
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_flags="--prod"
        log_warning "Deploying to PRODUCTION"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Deploy and capture the URL
    local deployment_output
    deployment_output=$(vercel deploy $deploy_flags --yes 2>&1)
    
    if [ $? -ne 0 ]; then
        log_error "Deployment failed"
        echo "$deployment_output"
        exit 1
    fi
    
    # Extract deployment URL
    HEALTH_CHECK_URL=$(echo "$deployment_output" | grep -E "https://.*\.vercel\.app" | tail -1 | tr -d ' ')
    
    if [ -z "$HEALTH_CHECK_URL" ]; then
        log_error "Could not extract deployment URL"
        exit 1
    fi
    
    log_success "Deployment completed: $HEALTH_CHECK_URL"
}

# Health check
health_check() {
    log_info "Running health checks on deployed application..."
    
    if [ -z "$HEALTH_CHECK_URL" ]; then
        log_error "No deployment URL available for health check"
        return 1
    fi
    
    local health_endpoint="$HEALTH_CHECK_URL/api/health"
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log_info "Health check attempt $((retry_count + 1))/$MAX_RETRIES..."
        
        local response
        local http_code
        
        # Make HTTP request and capture response
        response=$(curl -s -w "%{http_code}" "$health_endpoint" 2>/dev/null || echo "000")
        http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            log_success "Health check passed"
            
            # Parse and display health status
            local health_data="${response%???}"  # Remove last 3 chars (HTTP code)
            if command_exists "jq"; then
                echo "$health_data" | jq '.' 2>/dev/null || echo "$health_data"
            else
                echo "$health_data"
            fi
            
            return 0
        else
            log_warning "Health check failed (HTTP $http_code)"
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log_info "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log_error "Health checks failed after $MAX_RETRIES attempts"
    return 1
}

# Post-deployment actions
post_deployment() {
    log_info "Running post-deployment actions..."
    
    # Display deployment information
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "URL: $HEALTH_CHECK_URL"
    echo "Health Check: $HEALTH_CHECK_URL/api/health"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Production deployment notes:"
        echo "- Update your DNS records if using custom domain"
        echo "- Update environment variables in Vercel dashboard if needed"
        echo "- Monitor application logs for any issues"
        echo "- Share the URL with your team for testing"
    else
        log_info "Preview deployment notes:"
        echo "- Share this URL with friends for testing"
        echo "- This is a temporary preview deployment"
        echo "- Use for testing before production deployment"
    fi
    
    # Open URL in browser (optional)
    if command_exists "open" && [ -n "$HEALTH_CHECK_URL" ]; then
        read -p "Open deployment in browser? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$HEALTH_CHECK_URL"
        fi
    fi
}

# Cleanup on error
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Check the errors above."
        echo ""
        echo "Common issues:"
        echo "- Environment variables not set in Vercel dashboard"
        echo "- Build errors due to TypeScript issues"
        echo "- Database connection issues"
        echo "- Missing API keys"
        echo ""
        echo "For help, check:"
        echo "- Vercel dashboard: https://vercel.com/dashboard"
        echo "- Project logs in Vercel"
        echo "- DEVELOPER_GUIDE.md"
    fi
}

# Set up error handling
trap cleanup EXIT

# Main execution
main() {
    echo ""
    echo "🚀 AI Personal Trainer Deployment"
    echo "================================"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo ""
    
    validate_environment
    pre_deployment_checks
    deploy_to_vercel
    
    if health_check; then
        post_deployment
        log_success "Deployment completed successfully! 🎉"
    else
        log_warning "Deployment completed but health checks failed"
        log_info "Check the application manually: $HEALTH_CHECK_URL"
    fi
}

# Run main function
main "$@"