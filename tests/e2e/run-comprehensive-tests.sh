#!/bin/bash

# Comprehensive E2E Test Runner for AI Personal Trainer
# Phase 4: Complete E2E Testing Suite

set -e

echo "🚀 Starting Comprehensive E2E Testing Suite"
echo "============================================="

# Configuration
export PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL:-"http://localhost:3000"}
export NODE_ENV=test
export FORCE_COLOR=1

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Function to run test suite with error handling
run_test_suite() {
    local test_file="$1"
    local test_name="$2"
    local is_critical="${3:-false}"
    
    info "Running $test_name tests..."
    
    if npx playwright test "$test_file" --reporter=line; then
        log "✅ $test_name tests PASSED"
        ((PASSED_TESTS++))
    else
        if [ "$is_critical" = "true" ]; then
            error "❌ $test_name tests FAILED (CRITICAL)"
            ((FAILED_TESTS++))
            return 1
        else
            warn "⚠️ $test_name tests FAILED (NON-CRITICAL)"
            ((FAILED_TESTS++))
        fi
    fi
    ((TOTAL_TESTS++))
    
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if development server is running
    if curl -s "$PLAYWRIGHT_BASE_URL" > /dev/null; then
        log "✅ Development server is running at $PLAYWRIGHT_BASE_URL"
    else
        error "❌ Development server is not running at $PLAYWRIGHT_BASE_URL"
        info "Please start the development server with: pnpm dev"
        exit 1
    fi
    
    # Check if auth state exists
    if [ -f ".auth/user.json" ]; then
        log "✅ Authentication state found"
    else
        warn "⚠️ No authentication state found - some tests may fail"
        info "Run authentication setup first: npx playwright test auth.setup.ts"
    fi
    
    # Check Playwright browsers
    if npx playwright --version > /dev/null; then
        log "✅ Playwright is installed"
    else
        error "❌ Playwright is not installed"
        exit 1
    fi
    
    echo ""
}

# Function to run test categories
run_test_categories() {
    info "Starting comprehensive test execution..."
    echo ""
    
    # Category 1: Authentication and Basic Validation (CRITICAL)
    log "🔐 Category 1: Authentication & Basic Validation"
    run_test_suite "auth/" "Authentication" true
    run_test_suite "basic-validation.spec.ts" "Basic Validation" true
    
    # Category 2: Core Workout Functionality (CRITICAL)  
    log "💪 Category 2: Core Workout Functionality"
    run_test_suite "workouts/" "Workout Management" true
    run_test_suite "sessions/" "Workout Sessions" true
    
    # Category 3: User Interface and Interactions
    log "🎨 Category 3: User Interface & Interactions"
    run_test_suite "dashboard/" "Dashboard" false
    run_test_suite "exercises/" "Exercises" false
    run_test_suite "forms/" "Form Validation" false
    
    # Category 4: Internationalization
    log "🌐 Category 4: Internationalization"
    run_test_suite "internationalization/" "i18n (English/Spanish)" false
    
    # Category 5: Progress and Data
    log "📊 Category 5: Progress & Data Tracking"
    run_test_suite "progress/" "Progress Tracking" false
    
    # Category 6: Integration and End-to-End Flows
    log "🔗 Category 6: Integration & E2E Flows"
    run_test_suite "integration/" "Complete Workout Flow" false
    
    # Category 7: Final Validation
    log "✅ Category 7: Final System Validation"
    run_test_suite "final-validation.spec.ts" "Final Validation" false
}

# Function to generate test report
generate_report() {
    echo ""
    echo "📋 TEST EXECUTION SUMMARY"
    echo "========================="
    echo "Total Test Suites: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Skipped: $SKIPPED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "🎉 ALL TESTS PASSED! AI Personal Trainer E2E testing complete."
        echo ""
        log "✅ Workout creation and management"
        log "✅ Session execution with timer functionality" 
        log "✅ Progress tracking and dashboard"
        log "✅ Internationalization (English/Spanish)"
        log "✅ Form validation and error handling"
        log "✅ Navigation and routing"
        log "✅ Cross-browser compatibility"
        echo ""
        return 0
    else
        warn "⚠️ Some tests failed. See details above."
        
        if [ $PASSED_TESTS -gt 0 ]; then
            log "✅ $PASSED_TESTS test suite(s) passed successfully"
        fi
        
        if [ $FAILED_TESTS -gt 0 ]; then
            error "❌ $FAILED_TESTS test suite(s) failed"
        fi
        
        return 1
    fi
}

# Function to cleanup after tests
cleanup() {
    info "Cleaning up test artifacts..."
    
    # Clean up any test files created
    find . -name "*.test.tmp" -delete 2>/dev/null || true
    
    # Clean up screenshots/videos if not needed
    if [ "$KEEP_ARTIFACTS" != "true" ]; then
        rm -rf test-results/*.png test-results/*.webm 2>/dev/null || true
    fi
    
    log "✅ Cleanup complete"
}

# Function to handle script interruption
handle_interrupt() {
    error "Test execution interrupted"
    cleanup
    exit 130
}

# Main execution flow
main() {
    # Set up interrupt handling
    trap handle_interrupt SIGINT SIGTERM
    
    # Header
    echo ""
    log "AI Personal Trainer - Comprehensive E2E Test Suite"
    log "Phase 4: Complete workout functionality testing"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Run test categories
    run_test_categories
    
    # Generate report
    generate_report
    local exit_code=$?
    
    # Cleanup
    cleanup
    
    # Final message
    if [ $exit_code -eq 0 ]; then
        echo ""
        log "🎯 Phase 4: Comprehensive E2E testing COMPLETED SUCCESSFULLY!"
        log "The AI Personal Trainer application has been thoroughly tested."
        echo ""
        log "Next steps:"
        log "  • Review test reports in test-results/"
        log "  • Address any non-critical failures if needed"
        log "  • Proceed to Phase 2: Offline capability implementation"
        echo ""
    else
        echo ""
        error "❌ Phase 4: Some E2E tests failed"
        warn "Please review the failed tests and fix any critical issues before proceeding."
        echo ""
    fi
    
    exit $exit_code
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-artifacts)
            export KEEP_ARTIFACTS=true
            shift
            ;;
        --base-url)
            export PLAYWRIGHT_BASE_URL="$2"
            shift 2
            ;;
        --headed)
            export PLAYWRIGHT_HEADED=true
            shift
            ;;
        --debug)
            export DEBUG=true
            set -x
            shift
            ;;
        --help)
            echo "Comprehensive E2E Test Runner for AI Personal Trainer"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --keep-artifacts    Keep test screenshots and videos"
            echo "  --base-url URL      Set base URL (default: http://localhost:3000)"
            echo "  --headed           Run tests in headed mode"
            echo "  --debug            Enable debug output"
            echo "  --help             Show this help message"
            echo ""
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main