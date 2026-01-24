#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Open Attendance - Test Runner${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 테스트 타입 선택
TEST_TYPE=${1:-all}

# 유효한 테스트 타입인지 확인
if [[ ! "$TEST_TYPE" =~ ^(unit|e2e|all|watch)$ ]]; then
  echo -e "${RED}Error: Invalid test type '${TEST_TYPE}'${NC}"
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

# 환경 변수 설정
export NODE_ENV=test
export DATABASE_URL="file:./test.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="test-secret-key-for-testing-only"

echo -e "${YELLOW}Environment: ${NODE_ENV}${NC}"
echo -e "${YELLOW}Database: ${DATABASE_URL}${NC}"
echo ""

# 테스트 실행
case "$TEST_TYPE" in
  unit)
    echo -e "${GREEN}Running unit and integration tests...${NC}"
    npm run test
    ;;
  e2e)
    echo -e "${GREEN}Running E2E tests...${NC}"
    npm run test:e2e
    ;;
  watch)
    echo -e "${GREEN}Running tests in watch mode...${NC}"
    npm run test:watch
    ;;
  all)
    echo -e "${GREEN}Running all tests...${NC}"
    echo ""
    echo -e "${YELLOW}Step 1/2: Unit and Integration Tests${NC}"
    npm run test
    UNIT_TEST_EXIT_CODE=$?
    
    echo ""
    echo -e "${YELLOW}Step 2/2: E2E Tests${NC}"
    npm run test:e2e
    E2E_TEST_EXIT_CODE=$?
    
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  Test Results Summary${NC}"
    echo -e "${GREEN}======================================${NC}"
    
    if [ $UNIT_TEST_EXIT_CODE -eq 0 ]; then
      echo -e "${GREEN}✓ Unit/Integration Tests: PASSED${NC}"
    else
      echo -e "${RED}✗ Unit/Integration Tests: FAILED${NC}"
    fi
    
    if [ $E2E_TEST_EXIT_CODE -eq 0 ]; then
      echo -e "${GREEN}✓ E2E Tests: PASSED${NC}"
    else
      echo -e "${RED}✗ E2E Tests: FAILED${NC}"
    fi
    
    echo ""
    
    # 하나라도 실패하면 종료 코드 1 반환
    if [ $UNIT_TEST_EXIT_CODE -ne 0 ] || [ $E2E_TEST_EXIT_CODE -ne 0 ]; then
      exit 1
    fi
    ;;
esac

echo ""
echo -e "${GREEN}Tests completed!${NC}"
