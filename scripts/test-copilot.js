#!/usr/bin/env node

/**
 * Test GitHub Copilot API integration
 * Usage: GITHUB_TOKEN=your_token node scripts/test-copilot.js
 */

/**
 * Get GitHub token from environment or gh CLI
 */
async function getGitHubToken() {
  // Try environment variable first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Try to get token from gh CLI
  try {
    const { execSync } = await import('child_process');
    const token = execSync('gh auth token', { encoding: 'utf-8' }).trim();
    if (token) {
      console.log('✅ Using GitHub token from gh CLI\n');
      return token;
    }
  } catch (error) {
    // gh CLI not available or not authenticated
  }

  console.error('❌ Error: GitHub token not found\n');
  console.error('Please authenticate with GitHub CLI:');
  console.error('  gh auth login\n');
  console.error('Or set GITHUB_TOKEN environment variable:');
  console.error('  export GITHUB_TOKEN=$(gh auth token)\n');
  process.exit(1);
}

async function testCopilotAPI() {
  const token = await getGitHubToken();

  console.log('🧪 Testing GitHub Copilot API integration...\n');

  const testPrompt = `Generate a simple OpenAPI 3.1.0 schema for a test device.
Output only YAML, no markdown formatting.

schemas:
  TestDevice:
    type: object
    properties:
      deviceId:
        type: string
      deviceType:
        type: string
        enum:
          - Test
`;

  try {
    console.log('📡 Sending test request to GitHub Models API...');

    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an OpenAPI expert. Generate only YAML without markdown formatting.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      console.error('');
      console.error('Common issues:');
      console.error('- 401: Invalid or expired GitHub token');
      console.error('- 403: Token lacks necessary permissions or rate limit exceeded');
      console.error('- 404: GitHub Models API not available for your account');
      console.error('');
      console.error('Make sure:');
      console.error('1. Your token has "repo" scope');
      console.error('2. Your account has access to GitHub Models API');
      console.error('3. You haven\'t exceeded rate limits (15 req/min)');
      process.exit(1);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('✅ Success! GitHub Copilot API is working.\n');
    console.log('📝 Generated response:');
    console.log('─'.repeat(60));
    console.log(generatedContent);
    console.log('─'.repeat(60));
    console.log('');
    console.log('🎉 Test passed! Your GitHub token is configured correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run extract (to detect README changes)');
    console.log('2. Run: node scripts/update-device.js Bot (to test device update)');
    console.log('3. Run: npm run build (to validate the OpenAPI spec)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  }
}

testCopilotAPI();
