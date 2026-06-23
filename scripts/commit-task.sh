#!/usr/bin/env bash
#
# commit-task.sh — commit the Phase 1+2 modernization plan one task at a time.
#
# Each of the 9 plan tasks lands as its own commit, staging ONLY that task's
# files (explicit paths — never `git add -A` globally), so unrelated working-tree
# changes (docs/, .playwright-mcp/, cypress.env.json) are never swept in.
#
# Intended workflow (per the implementation plan):
#   1. Implement task N (write its files, run its tests green).
#   2. Run:  ./scripts/commit-task.sh N
#   3. Move on to task N+1.
#
# Notes:
#   * Some files are touched by more than one task (e.g. auth.steps.ts in tasks
#     3, 4, 9). The script stages the file's CURRENT diff, so commit each task
#     right after implementing it — before editing that shared file again for a
#     later task — to keep commits cleanly scoped.
#   * `cypress.env.json` holds secrets and is gitignored; it is never staged.
#
# Usage:
#   ./scripts/commit-task.sh <1-9>   Commit a single task.
#   ./scripts/commit-task.sh all     Commit tasks 1..9 in order (skips any with
#                                    no staged changes). Useful if you wrote all
#                                    the code first and want 9 commits at once.
#   ./scripts/commit-task.sh --list  Show the task list and exit.
#   ./scripts/commit-task.sh --help  Show this help.

set -euo pipefail

TRAILER="Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# Run from the repository root regardless of where the script is invoked.
cd "$(git rev-parse --show-toplevel)"

usage() {
  sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//; s/^#//' | sed '$d'
}

# Populate `files` (array) and `msg` (string) for the given task number.
load_task() {
  local n="$1"
  files=()
  case "$n" in
    1)
      msg="chore: migrate to Cypress 15 + TypeScript foundation, remove legacy live-site specs"
      files=(
        package.json
        package-lock.json
        tsconfig.json
        cypress.config.ts
        .gitignore
        eslint.config.mjs
        .prettierrc
        cypress.env.example.json
        cypress/support/e2e.ts
        cypress/support/commands.ts
        cypress/support/index.d.ts
        cypress/support/step_definitions/hooks.ts
        cypress/support/e2e.js
        cypress/support/commands.js
        cypress/e2e/predefined.feature
        cypress/e2e/searchEngines.feature
        cypress/e2e/shopping.feature
        cypress/e2e/demoBlaze.feature
        cypress/support/step_definitions/Predefined_Steps.js
        cypress/support/step_definitions/Demoblaze_Steps.js
        cypress/support/step_definitions/Hooks.js
        cypress/support/page-object/demoblaze_PO.js
        cypress/fixtures/demoblaze.json
      )
      ;;
    2)
      msg="feat: add BasePage, HomePage, and storefront smoke feature"
      files=(
        cypress/support/pages/BasePage.ts
        cypress/support/pages/HomePage.ts
        cypress/support/step_definitions/common.steps.ts
        cypress/e2e/features/catalog/home.feature
      )
      ;;
    3)
      msg="feat: add login modal page object and login/logout BDD scenarios"
      files=(
        cypress/support/pages/LoginModal.ts
        cypress/support/pages/BasePage.ts
        cypress.config.ts
        cypress/support/step_definitions/auth.steps.ts
        cypress/e2e/features/auth/login.feature
      )
      ;;
    4)
      msg="feat: add signup page object, unique-user factory, and signup scenario"
      files=(
        cypress/support/pages/SignupModal.ts
        cypress/support/factories/userFactory.ts
        cypress/e2e/features/auth/signup.feature
        cypress/support/step_definitions/auth.steps.ts
      )
      ;;
    5)
      msg="feat: add catalog browsing — category filter, product detail, pagination"
      files=(
        cypress/support/pages/ProductPage.ts
        cypress/support/pages/HomePage.ts
        cypress/support/step_definitions/catalog.steps.ts
        cypress/e2e/features/catalog/browse-products.feature
      )
      ;;
    6)
      msg="feat: add cart page object and add-to-cart scenario with alert handling"
      files=(
        cypress/support/pages/CartPage.ts
        cypress/support/pages/ProductPage.ts
        cypress/support/step_definitions/cart.steps.ts
        cypress/e2e/features/cart/add-to-cart.feature
        cypress/fixtures/products.json
      )
      ;;
    7)
      msg="feat: add checkout flow with place-order modal and confirmation"
      files=(
        cypress/support/pages/PlaceOrderModal.ts
        cypress/support/step_definitions/cart.steps.ts
        cypress/e2e/features/cart/checkout.feature
      )
      ;;
    8)
      msg="feat: add contact-form page object and scenario"
      files=(
        cypress/support/pages/ContactModal.ts
        cypress/support/step_definitions/contact.steps.ts
        cypress/e2e/features/contact/contact.feature
      )
      ;;
    9)
      msg="feat: add reusable login command, full-suite verification, and README overhaul"
      files=(
        cypress/support/commands.ts
        cypress/support/index.d.ts
        cypress/support/step_definitions/auth.steps.ts
        cypress/e2e/features/auth/login-command.feature
      )
      ;;
    *)
      echo "error: task must be 1-9 (got '$n')" >&2
      exit 1
      ;;
  esac
}

list_tasks() {
  local n
  for n in $(seq 1 9); do
    load_task "$n"
    printf 'Task %s: %s\n' "$n" "$msg"
  done
}

commit_task() {
  local n="$1"
  load_task "$n"

  # Stage only this task's paths. `-A` picks up modifications AND deletions;
  # `--ignore-unmatch` tolerates paths that don't apply to this task yet.
  local existing=()
  local f
  for f in "${files[@]}"; do
    # Stage if the path exists OR git is tracking it (so deletions are staged).
    if [[ -e "$f" ]] || git ls-files --error-unmatch -- "$f" >/dev/null 2>&1; then
      existing+=("$f")
    fi
  done

  if [[ ${#existing[@]} -gt 0 ]]; then
    git add -A -- "${existing[@]}"
  fi

  if git diff --cached --quiet; then
    echo "Task $n: nothing to commit (no staged changes) — skipping."
    return 0
  fi

  echo "Task $n: committing —"
  git diff --cached --name-status | sed 's/^/    /'
  git commit -m "$msg" -m "$TRAILER" >/dev/null
  echo "Task $n: committed \"$msg\""
}

main() {
  if [[ $# -ne 1 ]]; then
    usage
    exit 1
  fi

  case "$1" in
    --help|-h)
      usage
      ;;
    --list|list)
      list_tasks
      ;;
    all)
      local n
      for n in $(seq 1 9); do
        commit_task "$n"
      done
      ;;
    [1-9])
      commit_task "$1"
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
