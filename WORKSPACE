workspace(name = "nguniversal")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Add NodeJS rules (explicitly used for sass bundle rules)
http_archive(
    name = "build_bazel_rules_nodejs",
    strip_prefix = "rules_nodejs-c40ceb960af4213164d4299d8fbc8220ebdd727f",
    # TODO(CaerusKaru): temporarily depend on a specific commit because we want to make sure that
    # our CI is not flaky until there is a new version of the NodeJS rules. See commit:
    # https://github.com/bazelbuild/rules_nodejs/commit/c40ceb960af4213164d4299d8fbc8220ebdd727f
    url = "https://github.com/bazelbuild/rules_nodejs/archive/c40ceb960af4213164d4299d8fbc8220ebdd727f.zip",
)

# Add TypeScript rules
http_archive(
    name = "build_bazel_rules_typescript",
    strip_prefix = "rules_typescript-0.22.0",
    url = "https://github.com/bazelbuild/rules_typescript/archive/0.22.0.zip",
)

# Add Angular source and Bazel rules.
http_archive(
    name = "angular",
    strip_prefix = "angular-7.1.3",
    url = "https://github.com/angular/angular/archive/7.1.3.zip",
)

# Add RxJS as repository because those are needed in order to build Angular from source.
# Also we cannot refer to the RxJS version from the node modules because self-managed
# node modules are not guaranteed to be installed.
# TODO(gmagolan): remove this once rxjs ships with an named UMD bundle and we
# are no longer building it from source.
http_archive(
    name = "rxjs",
    sha256 = "72b0b4e517f43358f554c125e40e39f67688cd2738a8998b4a266981ed32f403",
    strip_prefix = "package/src",
    url = "https://registry.yarnpkg.com/rxjs/-/rxjs-6.3.3.tgz",
)

# We need to create a local repository called "npm" because currently Angular Universal
# stores all of it's NPM dependencies in the "@ngudeps" repository. This is necessary because
# we don't want to reserve the "npm" repository that is commonly used by downstream projects.
# Since we still need the "npm" repository in order to use the Angular or TypeScript Bazel
# rules, we create a local repository that is just defined in **this** workspace and is not
# being shipped to downstream projects. This can be removed once downstream projects can
# consume Angular Universal completely from NPM.
# TODO(CaerusKaru): remove once Angular Universal can be consumed from NPM with Bazel.
local_repository(
    name = "npm",
    path = "tools/npm-workspace",
)

# Add sass rules
http_archive(
    name = "io_bazel_rules_sass",
    strip_prefix = "rules_sass-1.15.2",
    url = "https://github.com/bazelbuild/rules_sass/archive/1.15.2.zip",
)

# Since we are explitly fetching @build_bazel_rules_typescript, we should explicitly ask for
# its transitive dependencies in case those haven't been fetched yet.
load("@build_bazel_rules_typescript//:package.bzl", "rules_typescript_dependencies")

rules_typescript_dependencies()

# Since we are explitly fetching @build_bazel_rules_nodejs, we should explicitly ask for
# its transitive dependencies in case those haven't been fetched yet.
load("@build_bazel_rules_nodejs//:package.bzl", "rules_nodejs_dependencies")

rules_nodejs_dependencies()

# Fetch transitive dependencies which are needed by the Angular build targets.
load("@angular//packages/bazel:package.bzl", "rules_angular_dependencies")

rules_angular_dependencies()

# Fetch transitive dependencies which are needed to use the Sass rules.
load("@io_bazel_rules_sass//:package.bzl", "rules_sass_dependencies")

rules_sass_dependencies()

load("@build_bazel_rules_nodejs//:defs.bzl", "check_bazel_version", "node_repositories")

check_bazel_version(minimum_bazel_version = "0.18.0")

node_repositories(
    node_version = "10.10.0",
    package_json = ["//:package.json"],
    preserve_symlinks = True,
    yarn_version = "1.12.1",
)

# Setup TypeScript Bazel workspace
load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")

ts_setup_workspace()

# Setup the Sass rule repositories.
load("@io_bazel_rules_sass//:defs.bzl", "sass_repositories")

sass_repositories()

# Setup Angular workspace for building (Bazel managed node modules)
load("@angular//:index.bzl", "ng_setup_workspace")

ng_setup_workspace()

load("@nguniversal//:index.bzl", "nguniversal_setup_workspace")

nguniversal_setup_workspace()

# Setup Go toolchain (required for Bazel web testing rules)
load("@io_bazel_rules_go//go:def.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains()

# Setup web testing. We need to setup a browser because the web testing rules for TypeScript need
# a reference to a registered browser (ideally that's a hermetic version of a browser)
load(
    "@io_bazel_rules_webtesting//web:repositories.bzl",
    "browser_repositories",
    "web_test_repositories",
)

web_test_repositories()

browser_repositories(
    chromium = True,
)
