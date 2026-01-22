# GitHub Secrets Configuration

This document describes the configuration required for the automated OpenAPI update workflow.

## GitHub Copilot Integration

This project uses **GitHub Models API** (powered by GitHub Copilot) for automatic schema generation. The best part: **no additional secrets needed!**

### How It Works

The workflow uses the built-in `GITHUB_TOKEN` which is automatically available in GitHub Actions. This token provides access to GitHub Models API (GPT-4o) for free within rate limits.

### Permissions Required

The workflow already includes the necessary permissions in `.github/workflows/update-api.yml`:

```yaml
permissions:
  contents: write       # To commit generated schemas
  pull-requests: write  # To create pull requests
  actions: read         # To access GitHub Models API
```

### No Configuration Needed! 🎉

Unlike OpenAI API, you don't need to:
- ❌ Create API keys
- ❌ Set up billing
- ❌ Configure secrets
- ❌ Pay per request (within rate limits)

The workflow will automatically use GitHub's AI models when it runs.

### Rate Limits

GitHub Models API provides generous rate limits:
- **Free tier**: 15 requests per minute
- **Sufficient for**: Daily updates (typically 0-5 device changes)

For this project, rate limits are more than adequate since:
- Updates run once per day
- Usually only 0-2 devices change at a time
- Even a full update (70 devices) would complete in ~5 minutes

### Alternative: OpenAI API

If you prefer to use OpenAI's API instead (not recommended):

**Name:** `OPENAI_API_KEY`
**Value:** Your OpenAI API key (starts with `sk-`)

You would need to modify `scripts/update-device.js` to use OpenAI's endpoint instead of GitHub Models API.

**Cost comparison:**
- GitHub Models: FREE (within rate limits)
- OpenAI GPT-4: ~$0.03-0.06 per device update (~$2-4/month)

## Workflow Permissions

The workflow also requires the following GitHub token permissions (automatically provided):

- `contents: write` - To commit generated schemas
- `pull-requests: write` - To create pull requests

These are configured in `.github/workflows/update-api.yml`:

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate API keys** periodically
3. **Monitor usage** to detect unexpected costs
4. **Use environment-specific keys** for testing vs production
5. **Limit API key permissions** to only what's needed

## Testing the Configuration

To verify the GitHub Models integration works:

1. Go to Actions tab in your repository
2. Select "Update OpenAPI Specification" workflow
3. Click "Run workflow" → "Run workflow"
4. Check the workflow logs - you should see "🤖 Calling GitHub Copilot API..."

## Troubleshooting

### "GITHUB_TOKEN not configured"

This should never happen in GitHub Actions as `GITHUB_TOKEN` is automatically provided. If you see this error:
- Verify the workflow has `actions: read` permission
- Check that the workflow is running in a GitHub repository (not locally)

### "GitHub API error (403)"

This means the token doesn't have access to GitHub Models API:
- Ensure your repository is public OR
- Ensure your organization has GitHub Copilot enabled
- Verify the workflow permissions include `actions: read`

### "Rate limit exceeded"

GitHub Models API has rate limits (15 requests/minute):
- Wait a few minutes and try again
- This is rarely an issue for daily automated updates
- Consider adding a delay between device updates if needed

### Testing Locally

To test the schema generation locally:

```bash
# Set your GitHub Personal Access Token
export GITHUB_TOKEN=ghp_your_token_here

# Run extraction to detect changes
npm run extract

# Update a specific device
node scripts/update-device.js Bot
```

**Getting a GitHub Personal Access Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token (starts with `ghp_`)

## Cost

🎉 **FREE!** GitHub Models API is included with GitHub at no additional cost (within rate limits).

## Alternative: Manual Updates

If you prefer not to use AI generation:

1. Create device schemas manually based on the official README
2. Use the bundle and validation scripts:
   ```bash
   npm run build
   ```

The automation system is optional - you can maintain schemas manually.
