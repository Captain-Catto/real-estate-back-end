/**
 * Test script to verify Zod validation implementation
 * Run with: node test-zod-validation.js
 */

// Use fetch instead of axios
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8080';

// Test data
const validData = {
  fullName: "Nguyễn Văn An",
  email: "test@example.com",
  password: "Password123",
  phone: "0912345678",
  agreeToTerms: true
};

const invalidData = {
  fullName: "",  // Empty name
  email: "invalid-email",  // Invalid email format
  password: "123",  // Too short password
  phone: "123",  // Invalid phone format
  agreeToTerms: false  // Must agree to terms
};

async function testValidation() {
  console.log('🧪 Testing Zod Validation Implementation');
  console.log('=' .repeat(50));

  // Test 1: Valid registration data
  try {
    console.log('\n✅ Test 1: Valid registration data');
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success: Registration accepted');
      console.log(`Status: ${response.status}`);
    } else if (response.status === 400 && data.message?.includes('already exists')) {
      console.log('✅ Expected: User already exists (validation passed)');
    } else {
      console.log('❌ Unexpected error:', data);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  // Test 2: Invalid registration data
  try {
    console.log('\n❌ Test 2: Invalid registration data');
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.errors) {
      console.log('✅ Success: Validation errors detected');
      console.log('Validation errors:');
      data.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    } else {
      console.log('❌ Unexpected: Invalid data was accepted or wrong error format');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  // Test 3: Invalid login data
  try {
    console.log('\n❌ Test 3: Invalid login data');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "invalid-email",
        password: ""
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.errors) {
      console.log('✅ Success: Login validation errors detected');
      console.log('Validation errors:');
      data.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    } else {
      console.log('❌ Unexpected: Invalid login data was accepted');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  // Test 4: Invalid user ID parameter
  try {
    console.log('\n❌ Test 4: Invalid user ID parameter');
    const response = await fetch(`${BASE_URL}/api/users/public/invalid-id`);
    const data = await response.json();
    
    if (response.status === 400 && data.errors) {
      console.log('✅ Success: Parameter validation errors detected');
      console.log('Validation errors:');
      data.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    } else {
      console.log('❌ Unexpected: Invalid user ID was accepted');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  console.log('\n🎉 Zod validation testing completed!');
  console.log('=' .repeat(50));
}

// Run tests
testValidation().catch(console.error);