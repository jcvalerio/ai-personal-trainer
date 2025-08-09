import { test as teardown } from '@playwright/test'
import { TestDataUtils } from './utils/test-data.utils'
import { AuthUtils } from './utils/auth.utils'

/**
 * Cleanup teardown for all tests
 * This runs once after all tests to clean up test data
 */
teardown('cleanup test data', async ({ page }) => {
  console.log('🧹 Starting test data cleanup...')
  
  if (process.env.TEST_CLEANUP_DATA !== 'true') {
    console.log('⏭️ Test data cleanup is disabled. Set TEST_CLEANUP_DATA=true to enable.')
    return
  }
  
  try {
    const testDataUtils = new TestDataUtils(page)
    
    // Clean up any test data created during tests
    await testDataUtils.cleanup()
    
    // Reset user profile to default state
    await testDataUtils.resetUserProfile()
    
    console.log('✅ Test data cleanup completed successfully')
    
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed (this may be expected):', error)
    // Don't fail the entire test suite if cleanup fails
  }
})

/**
 * Sign out cleanup
 */
teardown('sign out', async ({ page }) => {
  console.log('🚪 Signing out test user...')
  
  try {
    const authUtils = new AuthUtils(page)
    
    // Navigate to dashboard first to ensure we're on the app
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)
    
    // Sign out the test user
    await authUtils.signOut()
    
    console.log('✅ Test user signed out successfully')
    
  } catch (error) {
    console.warn('⚠️ Sign out failed (this may be expected):', error)
    // Don't fail if sign out fails - user might already be signed out
  }
})

/**
 * Browser cleanup
 */
teardown('browser cleanup', async ({ page, context }) => {
  console.log('🧹 Cleaning up browser state...')
  
  try {
    // Clear all cookies and storage
    await context.clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Clear any auth files
    const fs = require('fs')
    const path = require('path')
    
    const authFile = '.auth/user.json'
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile)
      console.log('🗑️ Removed authentication file')
    }
    
    console.log('✅ Browser cleanup completed')
    
  } catch (error) {
    console.warn('⚠️ Browser cleanup failed:', error)
  }
})