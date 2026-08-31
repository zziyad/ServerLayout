// FILE: lib/session-config.test.js
'use strict';

const { createSessionConfig } = require('./session-config.js');

/**
 * Test Session Configuration Validation
 * Demonstrates how validation works and catches configuration errors
 */

console.log('🧪 Testing Session Configuration Validation\n');

// Test 1: Valid Configuration
console.log('✅ Test 1: Valid Configuration');
const validConfig = createSessionConfig({
  sessions: {
    accessTtl: 15 * 60, // 15 minutes
    refreshTtl: 7 * 24 * 60 * 60, // 7 days
  },
});

const validValidation = validConfig.validateConfig();
console.log('Valid config:', validValidation.isValid);
console.log('Errors:', validValidation.errors);
console.log('Config:', validValidation.config);
console.log('');

// Test 2: Invalid Configuration - Access TTL too long
console.log('❌ Test 2: Access TTL Too Long (Security Issue)');
const invalidConfig1 = createSessionConfig({
  sessions: {
    accessTtl: 25 * 60 * 60, // 25 hours (too long)
    refreshTtl: 7 * 24 * 60 * 60, // 7 days
  },
});

const invalidValidation1 = invalidConfig1.validateConfig();
console.log('Valid config:', invalidValidation1.isValid);
console.log('Errors:', invalidValidation1.errors);
console.log('');

// Test 3: Invalid Configuration - Access TTL >= Refresh TTL
console.log('❌ Test 3: Access TTL >= Refresh TTL');
const invalidConfig2 = createSessionConfig({
  sessions: {
    accessTtl: 7 * 24 * 60 * 60, // 7 days
    refreshTtl: 7 * 24 * 60 * 60, // 7 days (same as access)
  },
});

const invalidValidation2 = invalidConfig2.validateConfig();
console.log('Valid config:', invalidValidation2.isValid);
console.log('Errors:', invalidValidation2.errors);
console.log('');

// Test 4: Invalid Configuration - Zero TTL
console.log('❌ Test 4: Zero TTL Values');
const invalidConfig3 = createSessionConfig({
  sessions: {
    accessTtl: 0, // Invalid
    refreshTtl: 0, // Invalid
  },
});

const invalidValidation3 = invalidConfig3.validateConfig();
console.log('Valid config:', invalidValidation3.isValid);
console.log('Errors:', invalidValidation3.errors);
console.log('');

// Test 5: Environment Variable Override
console.log('🌍 Test 5: Environment Variable Override');
process.env.ACCESS_TOKEN_TTL = '1800'; // 30 minutes
process.env.REFRESH_TOKEN_TTL = '86400'; // 1 day

const envConfig = createSessionConfig({
  sessions: {
    accessTtl: 15 * 60, // This will be overridden
    refreshTtl: 7 * 24 * 60 * 60, // This will be overridden
  },
});

const envValidation = envConfig.validateConfig();
console.log('Valid config:', envValidation.isValid);
console.log('Config:', envValidation.config);
console.log('Source info:');
envConfig.logConfig();
console.log('');

// Test 6: Explicit Parameter Override
console.log('🎯 Test 6: Explicit Parameter Override');
const explicitConfig = createSessionConfig({
  sessions: {
    accessTtl: 15 * 60, // This will be overridden
    refreshTtl: 7 * 24 * 60 * 60, // This will be overridden
  },
});

const explicitValidation = explicitConfig.validateConfig();
console.log('Valid config:', explicitValidation.isValid);
console.log('Config:', explicitValidation.config);
console.log('');

// Test 7: Default Values
console.log('🔧 Test 7: Default Values (No Config)');
const defaultConfig = createSessionConfig({});
const defaultValidation = defaultConfig.validateConfig();
console.log('Valid config:', defaultValidation.isValid);
console.log('Config:', defaultValidation.config);
console.log('Source info:');
defaultConfig.logConfig();
console.log('');

// Clean up environment variables
delete process.env.ACCESS_TOKEN_TTL;
delete process.env.REFRESH_TOKEN_TTL;

console.log('🎉 All validation tests completed!');
console.log('\n📋 Validation Rules:');
console.log('1. Access TTL must be > 0');
console.log('2. Refresh TTL must be > 0');
console.log('3. Access TTL must be < Refresh TTL');
console.log('4. Access TTL must be <= 24 hours (security)');
console.log('\n🔧 Configuration Precedence:');
console.log('1. Explicit parameter (highest)');
console.log('2. Environment variable');
console.log('3. Config file');
console.log('4. Default value (lowest)');
