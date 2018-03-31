workspace(name = "nguniversal")

http_archive(
    name = "com_github_bazelbuild_buildtools",
    # Note, this commit matches the version of buildifier in angular/ngcontainer
    url = "https://github.com/bazelbuild/buildtools/archive/b3b620e8bcff18ed3378cd3f35ebeb7016d71f71.zip",
    strip_prefix = "buildtools-b3b620e8bcff18ed3378cd3f35ebeb7016d71f71",
    sha256 = "dad19224258ed67cbdbae9b7befb785c3b966e5a33b04b3ce58ddb7824b97d73",
)

http_archive(
    name = "build_bazel_rules_nodejs",
    url = "https://github.com/bazelbuild/rules_nodejs/archive/0.6.0.zip",
    strip_prefix = "rules_nodejs-0.6.0",
    sha256 = "e8a2bb5ca51fbafb244bc507bcebcae33a63d969f47413b319a8dcce032845bf",
)

load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories", "yarn_install")
node_repositories(package_json = ["//:package.json"])


# Add TypeScript rules
http_archive(
    name = "build_bazel_rules_typescript",
    url = "https://github.com/bazelbuild/rules_typescript/archive/df4a1a561d88e187438ac7791a5ac33995f2d317.zip",
    strip_prefix = "rules_typescript-df4a1a561d88e187438ac7791a5ac33995f2d317",
    sha256 = "51a84f156eeddf126e9370b5c193b4709eeb330448e2de5afcda40232e0b56bc",
)

load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")
ts_setup_workspace()

# Some of the TypeScript is written in Go.
# Bazel doesn't support transitive WORKSPACE deps, so we must repeat them here.
http_archive(
    name = "io_bazel_rules_go",
    url = "https://github.com/bazelbuild/rules_go/releases/download/0.9.0/rules_go-0.9.0.tar.gz",
    sha256 = "4d8d6244320dd751590f9100cf39fd7a4b75cd901e1f3ffdfd6f048328883695",
)

load("@io_bazel_rules_go//go:def.bzl", "go_rules_dependencies", "go_register_toolchains")
go_rules_dependencies()
go_register_toolchains()


####################################
# Tell Bazel about some workspaces that were installed from npm.

local_repository(
    name = "angular",
    path = "node_modules/@angular/bazel",
)


local_repository(
    name = "rxjs",
    path = "node_modules/rxjs/src",
)
