#!/usr/bin/env bash
source ./scripts/ci/sources/tunnel.sh

is_e2e() {
  [[ "${MODE}" = e2e ]]
}

is_lint() {
  [[ "${MODE}" = lint ]]
}

is_build() {
  [[ "${MODE}" = build ]]
}

is_closure_compiler() {
  [[ "${MODE}" = closure-compiler ]]
}

is_unit() {
  [[ "${MODE}" =~ ^.*_(optional|required)$ ]]
}

is_ssr() {
  [[ "${MODE}" = ssr ]]
}
