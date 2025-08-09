import { test, expect } from '@playwright/test'
import { AuthUtils } from '../utils/auth.utils'
import { SignInPage, SignUpPage, OnboardingPage } from '../utils/page-objects/auth.pages'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test without authentication
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should load sign-in page correctly', async ({ page }) => {
    const signInPage = new SignInPage(page)
    
    await signInPage.navigate()
    await signInPage.verifyPageLoaded()
    
    // Verify page title
    await signInPage.assertTitleContains('Sign')
    
    // Check for essential elements
    await expect(page.locator('input[type="email"], input[name="identifier"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"], button:has-text("Sign in")')).toBeVisible()
  })

  test('should successfully sign in with valid credentials', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    const signInPage = new SignInPage(page)
    
    await signInPage.navigate()
    
    const testUser = authUtils.getTestUser()
    await signInPage.signIn(testUser.email, testUser.password)
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Verify authentication state
    await authUtils.verifyAuthenticated()
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    const signInPage = new SignInPage(page)
    
    await signInPage.navigate()
    
    // Try to sign in with invalid credentials
    await signInPage.fillSignInForm('invalid@example.com', 'wrongpassword')
    
    // Submit and expect to stay on sign-in page
    await signInPage.page.locator('button[type="submit"]').click()
    
    // Should remain on sign-in page
    await expect(page).toHaveURL(/.*\/sign-in/)
    
    // Should show error message (wait a bit for it to appear)
    await page.waitForTimeout(2000)
    const errorMessage = await signInPage.getErrorMessage()
    
    if (errorMessage) {
      expect(errorMessage.toLowerCase()).toContain('invalid')
    }
  })

  test('should navigate between sign-in and sign-up pages', async ({ page }) => {
    const signInPage = new SignInPage(page)
    const signUpPage = new SignUpPage(page)
    
    // Start at sign-in page
    await signInPage.navigate()
    await signInPage.verifyPageLoaded()
    
    // Navigate to sign-up
    if (await signInPage.elementExists('a[href*="sign-up"], a:has-text("Sign up")')) {
      await signInPage.navigateToSignUp()
      await signUpPage.verifyPageLoaded()
      
      // Navigate back to sign-in
      if (await signUpPage.elementExists('a[href*="sign-in"], a:has-text("Sign in")')) {
        await signUpPage.navigateToSignIn()
        await signInPage.verifyPageLoaded()
      }
    }
  })

  test('should handle onboarding flow after sign-in', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    const onboardingPage = new OnboardingPage(page)
    
    // Sign in
    await authUtils.signIn()
    
    // Check if we're redirected to onboarding
    const currentUrl = page.url()
    
    if (currentUrl.includes('/onboarding')) {
      // Complete onboarding
      await onboardingPage.verifyPageLoaded()
      await onboardingPage.completeOnboarding({
        firstName: 'Claude',
        lastName: 'Test',
        age: 30,
        fitnessLevel: 'intermediate',
        goals: 'general_fitness'
      })
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/)
    }
    
    // Verify final authentication state
    await authUtils.verifyAuthenticated()
  })

  test('should sign out successfully', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    
    // Sign in first
    await authUtils.signIn()
    await authUtils.verifyAuthenticated()
    
    // Sign out
    await authUtils.signOut()
    
    // Should redirect to sign-in page
    await authUtils.verifyNotAuthenticated()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to sign-in
    await page.waitForURL(/.*\/sign-in/, { timeout: 15000 })
    await expect(page).toHaveURL(/.*\/sign-in/)
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    
    // Sign in
    await authUtils.signIn()
    await authUtils.verifyAuthenticated()
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be authenticated
    await authUtils.verifyAuthenticated()
  })

  test('should handle authentication state properly', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    
    // Initially not authenticated
    let authState = await authUtils.getAuthState()
    expect(authState.isAuthenticated).toBe(false)
    
    // Sign in
    await authUtils.signIn()
    
    // Should be authenticated
    authState = await authUtils.getAuthState()
    expect(authState.isAuthenticated).toBe(true)
    expect(authState.email).toBeTruthy()
    
    // Sign out
    await authUtils.signOut()
    
    // Should not be authenticated
    authState = await authUtils.getAuthState()
    expect(authState.isAuthenticated).toBe(false)
  })
})

test.describe('Authentication Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    const signInPage = new SignInPage(page)
    
    // Navigate to sign-in page
    await signInPage.navigate()
    
    // Simulate network failure during sign-in
    await page.route('**/*', route => route.abort())
    
    const testUser = { email: 'test@example.com', password: 'password123' }
    await signInPage.fillSignInForm(testUser.email, testUser.password)
    
    // Try to submit (should fail due to network)
    await signInPage.page.locator('button[type="submit"]').click()
    
    // Should remain on sign-in page
    await expect(page).toHaveURL(/.*\/sign-in/)
    
    // Restore network
    await page.unroute('**/*')
  })

  test('should handle session expiration', async ({ page }) => {
    const authUtils = new AuthUtils(page)
    
    // Sign in
    await authUtils.signIn()
    await authUtils.verifyAuthenticated()
    
    // Clear session storage to simulate session expiration
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
      // Clear any auth-related cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      })
    })
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to sign-in
    await page.waitForURL(/.*\/sign-in/, { timeout: 15000 })
    await authUtils.verifyNotAuthenticated()
  })
})