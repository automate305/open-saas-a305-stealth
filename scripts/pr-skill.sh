#!/usr/bin/env bash
# pr-skill.sh — open a PR that promotes a skill file to Automate305 core.
#
# Usage:
#   ./scripts/pr-skill.sh skills/hvac-ai-receptionist.md
#   ./scripts/pr-skill.sh skills/hvac-ai-chatbot.md "optional PR title"
#
# Requires: git, gh (GitHub CLI, authenticated).
# Creates a branch `skill/<skill-name>` off the default branch containing only the
# given skill file (plus its knowledge-base folder if present), pushes it, and opens
# a PR against the default branch.

set -euo pipefail

SKILL_FILE="${1:-}"
if [[ -z "$SKILL_FILE" ]]; then
  echo "Usage: $0 <skills/skill-file.md> [pr-title]" >&2
  exit 1
fi
if [[ ! -f "$SKILL_FILE" ]]; then
  echo "Error: '$SKILL_FILE' not found." >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI 'gh' is required (https://cli.github.com)." >&2
  exit 1
fi

SKILL_NAME="$(basename "$SKILL_FILE" .md)"
PR_TITLE="${2:-Add skill: $SKILL_NAME}"
DEFAULT_BRANCH="$(git remote show origin | sed -n 's/.*HEAD branch: //p')"
BRANCH="skill/$SKILL_NAME"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "Promoting '$SKILL_FILE' via branch '$BRANCH' -> '$DEFAULT_BRANCH'"

git fetch origin "$DEFAULT_BRANCH"
git checkout -B "$BRANCH" "origin/$DEFAULT_BRANCH"

# Bring over the skill file (and the knowledge base it depends on, if present)
git checkout "$CURRENT_BRANCH" -- "$SKILL_FILE"
if [[ -d "data/hvac-knowledge" ]]; then
  git checkout "$CURRENT_BRANCH" -- data/hvac-knowledge || true
fi

if git diff --cached --quiet && git diff --quiet; then
  echo "Nothing to promote — '$SKILL_FILE' is identical on $DEFAULT_BRANCH." >&2
  git checkout "$CURRENT_BRANCH"
  exit 0
fi

git add "$SKILL_FILE" data/hvac-knowledge 2>/dev/null || git add "$SKILL_FILE"
git commit -m "Add skill: $SKILL_NAME"
git push -u origin "$BRANCH"

gh pr create \
  --base "$DEFAULT_BRANCH" \
  --head "$BRANCH" \
  --title "$PR_TITLE" \
  --body "Promotes \`$SKILL_FILE\` to core. Grounded in \`data/hvac-knowledge/\`."

git checkout "$CURRENT_BRANCH"
echo "Done."
