```bash
#!/bin/bash

set -e

# ============================================================
# Git History Cleanup Script
# Removes Terraform .terraform/ directory from Git history
#
# Use this when Terraform provider binaries were accidentally
# committed to Git/GitHub and made the repository extremely large.
# ============================================================

echo "============================================================"
echo " Git Repository History Cleanup"
echo "============================================================"

# ------------------------------------------------------------
# 1. Check that we are inside a Git repository
# ------------------------------------------------------------

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "ERROR: This is not a Git repository."
    exit 1
fi

echo ""
echo "[1/10] Git repository detected."

# ------------------------------------------------------------
# 2. Check current branch
# ------------------------------------------------------------

CURRENT_BRANCH=$(git branch --show-current)

echo "Current branch: ${CURRENT_BRANCH}"

if [ -z "${CURRENT_BRANCH}" ]; then
    echo "ERROR: Could not determine current branch."
    exit 1
fi

# ------------------------------------------------------------
# 3. Check git-filter-repo
# ------------------------------------------------------------

echo ""
echo "[2/10] Checking git-filter-repo..."

FILTER_REPO=""

if command -v git-filter-repo >/dev/null 2>&1; then
    FILTER_REPO="git-filter-repo"
elif [ -x "$HOME/AppData/Roaming/Python/Python314/Scripts/git-filter-repo.exe" ]; then
    FILTER_REPO="$HOME/AppData/Roaming/Python/Python314/Scripts/git-filter-repo.exe"
else
    echo ""
    echo "ERROR: git-filter-repo was not found."
    echo ""
    echo "Install it with:"
    echo "  python -m pip install --user git-filter-repo"
    echo ""
    echo "Then check:"
    echo "  ls ~/AppData/Roaming/Python/Python314/Scripts/"
    exit 1
fi

echo "Using: ${FILTER_REPO}"

# ------------------------------------------------------------
# 4. Create a backup branch
# ------------------------------------------------------------

echo ""
echo "[3/10] Creating backup branch..."

BACKUP_BRANCH="backup-before-history-cleanup"

if git show-ref --verify --quiet "refs/heads/${BACKUP_BRANCH}"; then
    echo "Backup branch already exists:"
    echo "  ${BACKUP_BRANCH}"
else
    git branch "${BACKUP_BRANCH}"
    echo "Backup branch created:"
    echo "  ${BACKUP_BRANCH}"
fi

# ------------------------------------------------------------
# 5. Make sure Terraform .terraform directory is ignored
# ------------------------------------------------------------

echo ""
echo "[4/10] Checking .gitignore..."

if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    touch .gitignore
fi

if grep -qxF "terraform/.terraform/" .gitignore; then
    echo "Terraform .terraform directory is already ignored."
else
    echo "terraform/.terraform/" >> .gitignore
    echo "Added terraform/.terraform/ to .gitignore."
fi

# Terraform state should also not be committed.

if grep -qxF "terraform/*.tfstate" .gitignore; then
    echo "Terraform state files are already ignored."
else
    cat >> .gitignore <<'EOF'

# Terraform
terraform/.terraform/
terraform/*.tfstate
terraform/*.tfstate.*
terraform/crash.log
terraform/crash.*.log
EOF

    echo "Added Terraform ignore rules."
fi

# ------------------------------------------------------------
# 6. Check whether .terraform exists in Git history
# ------------------------------------------------------------

echo ""
echo "[5/10] Checking Git history..."

if git rev-list --objects --all | grep -q 'terraform/\.terraform/'; then

    echo ""
    echo "Terraform .terraform directory FOUND in Git history."
    echo ""
    echo "Examples:"
    git rev-list --objects --all | grep 'terraform/\.terraform/' | head -10

else

    echo ""
    echo "No terraform/.terraform directory found in Git history."
    echo "Nothing needs to be removed."
fi

# ------------------------------------------------------------
# 7. Remove terraform/.terraform from ALL Git history
# ------------------------------------------------------------

echo ""
echo "[6/10] Removing terraform/.terraform from Git history..."

if git rev-list --objects --all | grep -q 'terraform/\.terraform/'; then

    "${FILTER_REPO}" \
        --path terraform/.terraform \
        --invert-paths

    echo ""
    echo "Terraform .terraform history removed."

else

    echo "Skipping history rewrite because .terraform is not present."
fi

# ------------------------------------------------------------
# 8. Verify cleanup
# ------------------------------------------------------------

echo ""
echo "[7/10] Verifying cleanup..."

if git rev-list --objects --all | grep -q 'terraform/\.terraform/'; then

    echo ""
    echo "ERROR: terraform/.terraform is STILL present in Git history."
    echo ""
    git rev-list --objects --all | grep 'terraform/\.terraform/' | head -20

    exit 1

else

    echo "SUCCESS: terraform/.terraform is completely removed."
fi

# ------------------------------------------------------------
# 9. Verify Terraform lock file remains
# ------------------------------------------------------------

echo ""
echo "[8/10] Checking Terraform lock file..."

if git ls-files --error-unmatch terraform/.terraform.lock.hcl >/dev/null 2>&1; then

    echo "SUCCESS:"
    echo "  terraform/.terraform.lock.hcl is still tracked."

else

    echo "WARNING:"
    echo "  terraform/.terraform.lock.hcl is not tracked."
    echo ""
    echo "This is normally okay if it was never committed."
fi

# ------------------------------------------------------------
# 10. Check remote and repository size
# ------------------------------------------------------------

echo ""
echo "[9/10] Checking Git remote..."

REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)

if [ -z "${REMOTE_URL}" ]; then

    echo ""
    echo "WARNING: No origin remote is configured."
    echo ""
    echo "Add your GitHub repository manually:"
    echo ""
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git"
    echo ""
    echo "Then run this script again or continue manually."

else

    echo "Origin:"
    echo "  ${REMOTE_URL}"
fi

echo ""
echo "Repository size:"
git count-objects -vH

# ------------------------------------------------------------
# Final instructions
# ------------------------------------------------------------

echo ""
echo "[10/10] Cleanup completed."
echo ""
echo "============================================================"
echo " IMPORTANT"
echo "============================================================"
echo ""
echo "The Git history has been rewritten."
echo ""
echo "Before pushing, verify:"
echo ""
echo "  git rev-list --objects --all | grep 'terraform/\\.terraform/'"
echo ""
echo "Expected result:"
echo "  No output"
echo ""
echo "Then check:"
echo ""
echo "  git status"
echo "  git remote -v"
echo ""
echo "If the remote exists, fetch it:"
echo ""
echo "  git fetch origin"
echo ""
echo "Then push the rewritten history:"
echo ""
echo "  git push origin ${CURRENT_BRANCH} --force-with-lease"
echo ""
echo "If --force-with-lease reports 'stale info' and you have"
echo "confirmed that this is your intentional history replacement,"
echo "you can use:"
echo ""
echo "  git push origin ${CURRENT_BRANCH} --force"
echo ""
echo "============================================================"
echo " Backup branch:"
echo "   ${BACKUP_BRANCH}"
echo "============================================================"
```
