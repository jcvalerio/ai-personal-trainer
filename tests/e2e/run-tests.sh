#!/bin/bash

# Comprehensive E2E Test Runner Script
# Usage: ./tests/e2e/run-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
HEADED=false
DEBUG=false
CLEAN_RESULTS=false
GENERATE_REPORT=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [test-type] [options]"
    echo ""
    echo "Test Types:"
    echo "  all         - Run all E2E tests (default)"
    echo "  auth        - Run authentication tests only"
    echo "  dashboard   - Run dashboard tests only"
    echo "  workouts    - Run workout management tests only"
    echo "  exercises   - Run exercise library tests only"
    echo "  progress    - Run progress tracking tests only"
    echo ""
    echo "Options:"
    echo "  --headed    - Run tests in headed mode (browser visible)"
    echo "  --debug     - Run tests in debug mode"
    echo "  --clean     - Clean test results before running"
    echo "  --report    - Generate and show HTML report after tests"
    echo "  --help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 auth --headed"
    echo "  $0 workouts --debug"
    echo "  $0 all --clean --report"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        auth|dashboard|workouts|exercises|progress|all)
            TEST_TYPE="$1"
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --clean)
            CLEAN_RESULTS=true
            shift
            ;;
        --report)
            GENERATE_REPORT=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_message $RED "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to check prerequisites
check_prerequisites() {
    print_message $BLUE "🔍 Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_message $RED "❌ Node.js is not installed"
        exit 1
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_message $RED "❌ pnpm is not installed"
        exit 1
    fi
    
    # Check if .env.test exists
    if [ ! -f ".env.test" ]; then
        print_message $YELLOW "⚠️  .env.test not found, using .env.local"
    fi
    
    # Check if test credentials are set
    if [ -z "$CLERK_CLAUDE_TEST_USER_EMAIL" ] && [ -z "$(grep CLERK_CLAUDE_TEST_USER_EMAIL .env.test 2>/dev/null)" ]; then
        print_message $YELLOW "⚠️  Test user credentials not found in environment"
    fi
    
    print_message $GREEN "✅ Prerequisites check passed"
}

# Function to set up test environment
setup_environment() {
    print_message $BLUE "🔧 Setting up test environment..."
    
    # Load test environment variables
    if [ -f ".env.test" ]; then
        export $(grep -v '^#' .env.test | xargs)
    fi
    
    # Set test-specific environment variables
    export NODE_ENV=test
    export PLAYWRIGHT_BASE_URL=http://localhost:3000
    
    # Install Playwright browsers if needed
    if [ ! -d "$HOME/Library/Caches/ms-playwright" ] && [ ! -d "$HOME/.cache/ms-playwright" ]; then
        print_message $BLUE "🌐 Installing Playwright browsers..."
        pnpm exec playwright install
    fi
    
    print_message $GREEN "✅ Environment setup complete"
}

# Function to clean test results
clean_results() {
    if [ "$CLEAN_RESULTS" = true ]; then
        print_message $BLUE "🧹 Cleaning previous test results..."
        rm -rf test-results playwright-report .auth/user.json
        mkdir -p test-results/screenshots
        print_message $GREEN "✅ Test results cleaned"
    fi
}

# Function to start development server
start_dev_server() {
    print_message $BLUE "🚀 Checking development server..."
    
    # Check if server is already running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_message $GREEN "✅ Development server is already running"
        return 0
    fi
    
    print_message $BLUE "🚀 Starting development server..."
    pnpm dev &
    SERVER_PID=$!
    
    # Wait for server to start
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_message $GREEN "✅ Development server started"
            return 0
        fi
        sleep 2
    done
    
    print_message $RED "❌ Failed to start development server"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
}

# Function to run specific test suite
run_tests() {
    local test_command="pnpm exec playwright test"
    
    # Add options based on flags
    if [ "$HEADED" = true ]; then
        test_command="$test_command --headed"
    fi
    
    if [ "$DEBUG" = true ]; then
        test_command="$test_command --debug"
    fi
    
    # Add test path based on type
    case $TEST_TYPE in
        auth)
            test_command="$test_command tests/e2e/auth/"
            ;;
        dashboard)
            test_command="$test_command tests/e2e/dashboard/"
            ;;
        workouts)
            test_command="$test_command tests/e2e/workouts/"
            ;;
        exercises)
            test_command="$test_command tests/e2e/exercises/"
            ;;
        progress)
            test_command="$test_command tests/e2e/progress/"
            ;;
        all)
            # Run all tests (default)
            ;;
    esac
    
    print_message $BLUE "🧪 Running $TEST_TYPE tests..."
    print_message $YELLOW "Command: $test_command"
    
    # Run the tests
    if $test_command; then
        print_message $GREEN "✅ Tests completed successfully"
        return 0
    else
        print_message $RED "❌ Tests failed"
        return 1
    fi
}

# Function to generate and show report
show_report() {
    if [ "$GENERATE_REPORT" = true ]; then
        print_message $BLUE "📊 Generating test report..."
        
        if [ -d "playwright-report" ]; then
            pnpm exec playwright show-report
        else
            print_message $YELLOW "⚠️  No report data found"
        fi
    fi
}

# Function to cleanup
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        print_message $BLUE "🛑 Stopping development server..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Main execution flow
main() {
    print_message $GREEN "🎭 AI Personal Trainer E2E Test Runner"
    print_message $BLUE "Test Type: $TEST_TYPE"
    
    check_prerequisites
    setup_environment
    clean_results
    start_dev_server
    
    # Run tests and capture exit code
    if run_tests; then
        TEST_RESULT=0
    else
        TEST_RESULT=1
    fi
    
    show_report
    
    # Print summary
    if [ $TEST_RESULT -eq 0 ]; then
        print_message $GREEN "🎉 All tests passed!"
    else
        print_message $RED "💥 Some tests failed!"
    fi
    
    exit $TEST_RESULT
}

# Run main function
main