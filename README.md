# Angular Universal

Angular Universal was a project to expand on the core APIs from Angular
(platform-server) to enable developers to do server side rendering of Angular
applications in a variety of scenarios.

## This repository has been merged into the Angular CLI repo

In version 17, Universal has been moved into the
[Angular CLI repo](https://github.com/angular/angular-cli). Code has been
refactored and renamed (mostly under
[`@angular/ssr`](https://github.com/angular/angular-cli/tree/main/packages/angular/ssr/)
now), but the core functionality and architecture is unchanged.

Universal features such as server-side rendering and build-time prerendering are
now directly supported in Angular CLI and do not require a separate integration
with Universal.

As a result, this repository is effectively in maintenance mode and is no longer
accepting contributions. Improvements to Angular's SSR/prerendering tooling
should be made against the [CLI repo](https://github.com/angular/angular-cli)
directly. Universal versions under long-term support (LTS) are still maintained
by the Angular team and will continue to receive security fixes until they fall
out of LTS.
