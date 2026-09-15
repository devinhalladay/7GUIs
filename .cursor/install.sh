#!/usr/bin/env bash
# Idempotent environment bootstrap for the 7GUIs (Reagent/ClojureScript) project.
# Installs Leiningen if missing and pre-fetches project dependencies.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$REPO_ROOT/reagent-cljs"

if ! command -v lein >/dev/null 2>&1; then
  echo "Installing Leiningen..."
  LEIN_URL="https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein"
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo curl -fsSL "$LEIN_URL" -o /usr/local/bin/lein
    sudo chmod +x /usr/local/bin/lein
  else
    mkdir -p "$HOME/.local/bin"
    curl -fsSL "$LEIN_URL" -o "$HOME/.local/bin/lein"
    chmod +x "$HOME/.local/bin/lein"
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

# Bootstrap Leiningen's self-install and download all project dependencies.
cd "$PROJECT_DIR"
lein deps
echo "Environment ready. Run 'cd reagent-cljs && lein figwheel' to start the dev server (http://localhost:3449)."
