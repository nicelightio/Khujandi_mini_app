# Zip Context Ignore

This file is produced by a project scan from the global `zip-context` skill.

- The first block contains concrete exclusions detected in this project.
- The second block is for manual project-specific additions.
- Run `update` when the project layout changes and you want to rescan it.

## Auto-Detected Exclusions
<!-- zip-context:generated:start -->
```ignore
# Always exclude repository internals and local helper files
.git/
zip_context_ignore.md

# Found in this project: local metadata and editor noise
*.swp
*.swo

# Found in this project: .gitignore and lockfiles
.gitignore
package-lock.json

# Found in this project: build, cache, and generated directories
dist/
node_modules/

# Found in this project: binary-heavy asset directories
public/media/

# Detected binary/media/archive extensions in this project
*.png

# Found in this project: env or secret-like files
.env
```
<!-- zip-context:generated:end -->

## Manual Additions
<!-- zip-context:extra:start -->
```ignore
# add project-specific patterns here
```
<!-- zip-context:extra:end -->
