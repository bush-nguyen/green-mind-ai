# Environment Setup

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Anthropic API Key for Claude models
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Setting up the environment

1. Copy the API key from your Anthropic account
2. Create a `.env` file in the project root
3. Add the API key to the `.env` file
4. The application will automatically load the environment variables

## Security Note

Never commit your `.env` file to version control. It's already added to `.gitignore` to prevent accidental commits.
