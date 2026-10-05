[private]
default:
  @just --list

# Install dependencies
install:
  npm install

# Start the development server with hot reload
dev:
  npm run dev

# Build the static site into dist/
build:
  npm run build

# Serve the built site locally
preview:
  npm run preview

# Run the unit tests, the type check, a build and the link check
check:
  npm test
  npm run check
  npm run build
  npm run check-links

# Copy the settings template from a kanaemi checkout (default: ../kanaemi)
sync-config kanaemi="":
  scripts/sync-config.sh {{kanaemi}}

# Redraw the usage illustrations in public/guide (needs usvg and resvg)
guide:
  scripts/guide/build.sh

# Remove build output
clean:
  rm -rf dist .astro
