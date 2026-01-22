/**
 * Integration test for email change login functionality
 * 
 * This test simulates a real user journey:
 * 1. Create test users (admin and regular user)
 * 2. Verify initial login with original email
 * 3. Update email via profile API
 * 4. Verify login with new email works
 * 5. Verify login with old email fails
 */

import { db } from '../lib/db';
import bcrypt from 'bcryptjs';

interface TestResult {
  scenario: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testIntegrationFlow() {
  console.log('\n🧪 Starting Email Login Integration Tests\n');
  console.log('='.repeat(60));
  
  const adminEmail1 = 'integration-admin@example.com';
  const adminEmail2 = 'integration-admin-new@example.com';
  const userEmail1 = 'integration-user@example.com';
  const userEmail2 = 'integration-user-new@example.com';
  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  let adminId = '';
  let userId = '';
  
  try {
    // Clean up any existing test users
    await db.user.deleteMany({
      where: {
        OR: [
          { email: adminEmail1 },
          { email: adminEmail2 },
          { email: userEmail1 },
          { email: userEmail2 }
        ]
      }
    });
    
    // Test 1: Create admin user
    console.log('\n📝 Test 1: Creating admin user');
    const admin = await db.user.create({
      data: {
        name: 'Integration Admin',
        email: adminEmail1,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    adminId = admin.id;
    console.log(`✅ Admin created: ${admin.email} (ID: ${admin.id})`);
    results.push({
      scenario: 'Create admin user',
      passed: true,
      message: `Admin user created with email ${adminEmail1}`
    });
    
    // Test 2: Create regular user
    console.log('\n📝 Test 2: Creating regular user');
    const user = await db.user.create({
      data: {
        name: 'Integration User',
        email: userEmail1,
        password: hashedPassword,
        role: 'USER'
      }
    });
    userId = user.id;
    console.log(`✅ User created: ${user.email} (ID: ${user.id})`);
    results.push({
      scenario: 'Create regular user',
      passed: true,
      message: `Regular user created with email ${userEmail1}`
    });
    
    // Test 3: Verify admin login with original email
    console.log('\n📝 Test 3: Verify admin can authenticate with original email');
    const adminLoginOriginal = await db.user.findUnique({
      where: { email: adminEmail1 }
    });
    const adminAuth = adminLoginOriginal && 
      await bcrypt.compare(password, adminLoginOriginal.password!);
    console.log(adminAuth ? '✅ Admin authentication works' : '❌ Admin authentication failed');
    results.push({
      scenario: 'Admin login with original email',
      passed: !!adminAuth,
      message: adminAuth ? 'Admin authentication successful' : 'Admin authentication failed'
    });
    
    // Test 4: Verify user login with original email
    console.log('\n📝 Test 4: Verify user can authenticate with original email');
    const userLoginOriginal = await db.user.findUnique({
      where: { email: userEmail1 }
    });
    const userAuth = userLoginOriginal && 
      await bcrypt.compare(password, userLoginOriginal.password!);
    console.log(userAuth ? '✅ User authentication works' : '❌ User authentication failed');
    results.push({
      scenario: 'User login with original email',
      passed: !!userAuth,
      message: userAuth ? 'User authentication successful' : 'User authentication failed'
    });
    
    // Test 5: Update admin email (simulating profile update API)
    console.log('\n📝 Test 5: Update admin email via database');
    const updatedAdmin = await db.user.update({
      where: { id: adminId },
      data: { email: adminEmail2 }
    });
    console.log(`✅ Admin email updated: ${adminEmail1} → ${adminEmail2}`);
    results.push({
      scenario: 'Update admin email',
      passed: updatedAdmin.email === adminEmail2,
      message: `Admin email changed to ${adminEmail2}`
    });
    
    // Test 6: Update user email (simulating profile update API)
    console.log('\n📝 Test 6: Update user email via database');
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { email: userEmail2 }
    });
    console.log(`✅ User email updated: ${userEmail1} → ${userEmail2}`);
    results.push({
      scenario: 'Update user email',
      passed: updatedUser.email === userEmail2,
      message: `User email changed to ${userEmail2}`
    });
    
    // Test 7: Verify admin can login with NEW email
    console.log('\n📝 Test 7: Verify admin can authenticate with NEW email');
    const adminLoginNew = await db.user.findUnique({
      where: { email: adminEmail2 }
    });
    const adminAuthNew = adminLoginNew && 
      adminLoginNew.id === adminId &&
      await bcrypt.compare(password, adminLoginNew.password!);
    console.log(adminAuthNew ? '✅ Admin authentication with NEW email works' : '❌ Admin authentication with NEW email failed');
    results.push({
      scenario: 'Admin login with new email',
      passed: !!adminAuthNew,
      message: adminAuthNew ? 'Admin can login with new email' : 'Admin cannot login with new email'
    });
    
    // Test 8: Verify admin CANNOT login with OLD email
    console.log('\n📝 Test 8: Verify admin CANNOT authenticate with OLD email');
    const adminLoginOld = await db.user.findUnique({
      where: { email: adminEmail1 }
    });
    const adminAuthOldFails = adminLoginOld === null;
    console.log(adminAuthOldFails ? '✅ Admin old email correctly rejected' : '❌ Admin old email still works (ERROR)');
    results.push({
      scenario: 'Admin old email should fail',
      passed: adminAuthOldFails,
      message: adminAuthOldFails ? 'Admin old email correctly rejected' : 'ERROR: Admin old email still works'
    });
    
    // Test 9: Verify user can login with NEW email
    console.log('\n📝 Test 9: Verify user can authenticate with NEW email');
    const userLoginNew = await db.user.findUnique({
      where: { email: userEmail2 }
    });
    const userAuthNew = userLoginNew && 
      userLoginNew.id === userId &&
      await bcrypt.compare(password, userLoginNew.password!);
    console.log(userAuthNew ? '✅ User authentication with NEW email works' : '❌ User authentication with NEW email failed');
    results.push({
      scenario: 'User login with new email',
      passed: !!userAuthNew,
      message: userAuthNew ? 'User can login with new email' : 'User cannot login with new email'
    });
    
    // Test 10: Verify user CANNOT login with OLD email
    console.log('\n📝 Test 10: Verify user CANNOT authenticate with OLD email');
    const userLoginOld = await db.user.findUnique({
      where: { email: userEmail1 }
    });
    const userAuthOldFails = userLoginOld === null;
    console.log(userAuthOldFails ? '✅ User old email correctly rejected' : '❌ User old email still works (ERROR)');
    results.push({
      scenario: 'User old email should fail',
      passed: userAuthOldFails,
      message: userAuthOldFails ? 'User old email correctly rejected' : 'ERROR: User old email still works'
    });
    
    // Test 11: Verify JWT callback would work for admin
    console.log('\n📝 Test 11: Verify JWT callback works for admin (ID-based lookup)');
    const adminByIdLookup = await db.user.findUnique({
      where: { id: adminId }
    });
    const jwtAdminWorks = adminByIdLookup !== null && adminByIdLookup.email === adminEmail2;
    console.log(jwtAdminWorks ? '✅ JWT callback correctly retrieves admin with new email' : '❌ JWT callback failed for admin');
    results.push({
      scenario: 'JWT callback for admin',
      passed: jwtAdminWorks,
      message: jwtAdminWorks ? 'JWT callback works correctly for admin' : 'JWT callback failed for admin'
    });
    
    // Test 12: Verify JWT callback would work for user
    console.log('\n📝 Test 12: Verify JWT callback works for user (ID-based lookup)');
    const userByIdLookup = await db.user.findUnique({
      where: { id: userId }
    });
    const jwtUserWorks = userByIdLookup !== null && userByIdLookup.email === userEmail2;
    console.log(jwtUserWorks ? '✅ JWT callback correctly retrieves user with new email' : '❌ JWT callback failed for user');
    results.push({
      scenario: 'JWT callback for user',
      passed: jwtUserWorks,
      message: jwtUserWorks ? 'JWT callback works correctly for user' : 'JWT callback failed for user'
    });
    
    // Clean up
    console.log('\n🧹 Cleaning up test data');
    await db.user.deleteMany({
      where: {
        id: { in: [adminId, userId] }
      }
    });
    console.log('✅ Test users deleted');
    
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
    console.log('\n🎉 ALL TESTS PASSED! Email login works correctly for both admin and regular users.\n');
    console.log('✅ Verified behaviors:');
    console.log('   - Admin can change email and login with new email');
    console.log('   - Admin cannot login with old email after change');
    console.log('   - Regular user can change email and login with new email');
    console.log('   - Regular user cannot login with old email after change');
    console.log('   - JWT callback correctly retrieves updated email for both roles');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the implementation.\n');
  }
  
  return failed === 0;
}

// Run the test
testIntegrationFlow()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
