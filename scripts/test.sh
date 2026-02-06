#!/usr/bin/env bash

# Test script for open-attendance project
# Usage: ./scripts/test.sh [unit|e2e|all|watch]

set -e

# Load utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

PROJECT_ROOT=$(get_project_root)
cd "$PROJECT_ROOT"

print_header "Open Attendance - Test Runner"
echo ""

# Choose test type
TEST_TYPE=${1:-all}

# Check for help flag
if [[ "$TEST_TYPE" == "--help" ]] || [[ "$TEST_TYPE" == "-h" ]]; then
  echo "Usage: ./scripts/test.sh [unit|e2e|all|watch]"
  echo ""
  echo "Options:"
  echo "  unit   - Run unit and integration tests with Vitest"
  echo "  e2e    - Run end-to-end tests with Playwright"
  echo "  all    - Run all tests (default)"
  echo "  watch  - Run unit tests in watch mode"
  exit 0
fi

# Check if valid test type
if [[ ! "$TEST_TYPE" =~ ^(unit|e2e|all|watch)$ ]]; then
  print_error "Invalid test type '${TEST_TYPE}'"
  echo ""
  echo "Usage: ./scripts/test.sh [unit|e2e|all|watch]"
  echo ""
  echo "Options:"
  echo "  unit   - Run unit and integration tests with Vitest"
  echo "  e2e    - Run end-to-end tests with Playwright"
  echo "  all    - Run all tests (default)"
  echo "  watch  - Run unit tests in watch mode"
  echo ""
  exit 1
fi

# Ensure dependencies are installed for testing (use npm ci for production-like environment)
ensure_node_modules "npm ci"

# Set environment variables
export NODE_ENV=test
export DATABASE_URL="file:./test.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="test-secret-key-for-testing-only"

print_warning "Environment: ${NODE_ENV}"
print_warning "Database: ${DATABASE_URL}"
echo ""

# Execute tests
case "$TEST_TYPE" in
  unit)
    print_info "Running unit and integration tests..."
    npm run test
    ;;
  e2e)
    print_info "Running E2E tests..."
    npx playwright test
    E2E_EXIT_CODE=$?
    echo ""
    print_warning "To view the test report, run:"
    echo -e "  npx playwright show-report"
    exit $E2E_EXIT_CODE
    ;;
  watch)
    print_info "Running tests in watch mode..."
    npm run test:watch
    ;;
  all)
    print_info "Running all tests..."
    echo ""
    print_warning "Step 1/3: Unit and Integration Tests"
    npm run test
    UNIT_TEST_EXIT_CODE=$?

    echo ""
    print_warning "Step 2/3: Build Test"
    npm run build
    BUILD_EXIT_CODE=$?
    
    echo ""
    print_warning "Step 3/3: E2E Tests"
    npx playwright test
    E2E_TEST_EXIT_CODE=$?
    
    echo ""
    print_header "Test Results Summary"
    
    if [ $UNIT_TEST_EXIT_CODE -eq 0 ]; then
      print_success "Unit/Integration Tests: PASSED"
    else
      print_error "Unit/Integration Tests: FAILED"
    fi

    if [ $BUILD_EXIT_CODE -eq 0 ]; then
      print_success "Build: SUCCESSFUL"
    else
      print_error "Build: FAILED"
    fi
    
    if [ $E2E_TEST_EXIT_CODE -eq 0 ]; then
      print_success "E2E Tests: PASSED"
    else
      print_error "E2E Tests: FAILED"
    fi
    
    echo ""
    print_warning "To view the E2E test report, run:"
    echo -e "  npx playwright show-report"
    echo ""

    # 하나라도 실패하면 종료 코드 1 반환
    if [ $UNIT_TEST_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ] || [ $E2E_TEST_EXIT_CODE -ne 0 ]; then
      exit 1
    fi
    ;;
esac

echo ""
print_success "Tests completed!"
