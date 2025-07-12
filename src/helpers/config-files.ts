export const prettierConfigFile = `
{
  "semi": false,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false,
  "arrowParens": "avoid"
}
`

export const pushFile = `
#!/bin/bash

# Exit immediately if a command fails
set -e

# Switch to the main branch
git checkout main

# Merge the dev branch into main
git merge dev
if [ $? -ne 0 ]; then
    echo "❌ Merge conflict occurred. Please resolve it manually."
    exit 1
fi

# Push changes to GitHub
git push origin main
if [ $? -ne 0 ]; then
    echo "❌ Failed to push changes to GitHub. Please check your network connection and permissions."
    exit 1
fi

echo "✅ Successfully merged 'dev' into 'main' and pushed to GitHub!"

git checkout dev
if [ $? -ne 0 ]; then
    echo "❌ Failed to switch back to the 'dev' branch."
    exit 1
fi
`
