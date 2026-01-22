/**
 * Test script to verify email change login functionality
 * 
 * This script tests the following scenarios:
 * 1. Login with original email - should work
 * 2. Change email in database
 * 3. Login with new email - should work
 * 4. Login with old email - should fail
 * 5. Verify existing session still works after email change
 */

import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { signIn } from 'next-auth/react';

interface TestResult {
  scenario: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testEmailLoginFlow() {
  console.log('\n🧪 Starting Email Login Verification Tests\n');
  console.log('='.repeat(60));
  
  const testEmail1 = 'test-admin@example.com';
  const testEmail2 = 'test-admin-updated@example.com';
  const testPassword = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  try {
    // Clean up any existing test users
    await db.user.deleteMany({
      where: {
        OR: [
          { email: testEmail1 },
          { email: testEmail2 }
        ]
      }
    });
    
    // Scenario 1: Create a test admin user
    console.log('\n📝 Scenario 1: Creating test admin user');
    const testUser = await db.user.create({
      data: {
        name: 'Test Admin',
        email: testEmail1,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`✅ Created user: ${testUser.email} (ID: ${testUser.id})`);
    results.push({
      scenario: 'Create test user',
      passed: true,
      message: `User created with email ${testEmail1}`
    });
    
    // Scenario 2: Verify user can be found by original email
    console.log('\n📝 Scenario 2: Finding user by original email');
    const foundUser = await db.user.findUnique({
      where: { email: testEmail1 }
    });
    const scenario2Pass = foundUser !== null && foundUser.id === testUser.id;
    console.log(scenario2Pass ? '✅ User found by original email' : '❌ User NOT found by original email');
    results.push({
      scenario: 'Find user by original email',
      passed: scenario2Pass,
      message: scenario2Pass ? 'User found successfully' : 'User not found'
    });
    
    // Scenario 3: Update email
    console.log('\n📝 Scenario 3: Updating user email');
    const updatedUser = await db.user.update({
      where: { id: testUser.id },
      data: { email: testEmail2 }
    });
    console.log(`✅ Email updated: ${testEmail1} → ${testEmail2}`);
    results.push({
      scenario: 'Update user email',
      passed: true,
      message: `Email changed to ${testEmail2}`
    });
    
    // Scenario 4: Verify user can be found by NEW email
    console.log('\n📝 Scenario 4: Finding user by NEW email');
    const foundByNewEmail = await db.user.findUnique({
      where: { email: testEmail2 }
    });
    const scenario4Pass = foundByNewEmail !== null && foundByNewEmail.id === testUser.id;
    console.log(scenario4Pass ? '✅ User found by NEW email' : '❌ User NOT found by NEW email');
    results.push({
      scenario: 'Find user by new email',
      passed: scenario4Pass,
      message: scenario4Pass ? 'User found with new email' : 'User not found with new email'
    });
    
    // Scenario 5: Verify user CANNOT be found by OLD email
    console.log('\n📝 Scenario 5: Verifying OLD email no longer works');
    const foundByOldEmail = await db.user.findUnique({
      where: { email: testEmail1 }
    });
    const scenario5Pass = foundByOldEmail === null;
    console.log(scenario5Pass ? '✅ OLD email correctly returns null' : '❌ OLD email still returns user (ERROR)');
    results.push({
      scenario: 'Old email should not work',
      passed: scenario5Pass,
      message: scenario5Pass ? 'Old email correctly returns null' : 'ERROR: Old email still works'
    });
    
    // Scenario 6: Simulate authorize() function with NEW email
    console.log('\n📝 Scenario 6: Simulating login with NEW email');
    const loginUserNew = await db.user.findUnique({
      where: { email: testEmail2 }
    });
    if (loginUserNew && loginUserNew.password) {
      const isPasswordValid = await bcrypt.compare(testPassword, loginUserNew.password);
      const scenario6Pass = isPasswordValid && loginUserNew.id === testUser.id;
      console.log(scenario6Pass ? '✅ Login with NEW email would succeed' : '❌ Login with NEW email would fail');
      results.push({
        scenario: 'Login with new email',
        passed: scenario6Pass,
        message: scenario6Pass ? 'Login successful with new email' : 'Login failed with new email'
      });
    } else {
      console.log('❌ Could not find user or password for login simulation');
      results.push({
        scenario: 'Login with new email',
        passed: false,
        message: 'User not found for login'
      });
    }
    
    // Scenario 7: Simulate authorize() function with OLD email
    console.log('\n📝 Scenario 7: Simulating login with OLD email');
    const loginUserOld = await db.user.findUnique({
      where: { email: testEmail1 }
    });
    const scenario7Pass = loginUserOld === null;
    console.log(scenario7Pass ? '✅ Login with OLD email correctly fails (user not found)' : '❌ Login with OLD email incorrectly succeeds');
    results.push({
      scenario: 'Login with old email should fail',
      passed: scenario7Pass,
      message: scenario7Pass ? 'Old email correctly rejected' : 'ERROR: Old email still works'
    });
    
    // Scenario 8: Test JWT callback with ID lookup
    console.log('\n📝 Scenario 8: Simulating JWT callback (ID-based lookup)');
    const userById = await db.user.findUnique({
      where: { id: testUser.id }
    });
    const scenario8Pass = userById !== null && userById.email === testEmail2;
    console.log(scenario8Pass ? '✅ JWT callback would get updated email from DB' : '❌ JWT callback would not get correct email');
    results.push({
      scenario: 'JWT callback ID lookup',
      passed: scenario8Pass,
      message: scenario8Pass ? 'JWT callback correctly retrieves updated email' : 'JWT callback failed'
    });
    
    // Clean up
    console.log('\n🧹 Cleaning up test data');
    await db.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user deleted');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.push({
      scenario: 'Test execution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.scenario}: ${result.message}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Email login functionality is working correctly.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the implementation.\n');
  }
  
  return failed === 0;
}

// Run the test
testEmailLoginFlow()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
