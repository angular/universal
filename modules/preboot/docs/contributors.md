# Preboot Contributors Guide

## How to Contribute

Will be adding to this soon. For now just create a pull request.

## Preboot Design

More info coming soon on the internals of this library, but if you look through the code, you will find that it
has a lot of comments is should be pretty easy to follow along. Start with 
[preboot_client](https://github.com/jeffwhelpley/preboot/blob/master/src/client/preboot_client.js).

## ToDo

Although this library works really well with my preliminary basic tests, there is still a lot of work to be done.
Any help you want to give in any of these areas with a pull request would be much appreciated.

**High priority**
 
1. Optional Code - Need to get the Browserify ignore() working. Something messed up with it now. 
1. keyup.enter - Total hack there now. Need better solution (see event_manager)
1. Matching fuzzy logic - Need fuzzy logic for matching server node to client node. Right now has to be exact match.
1. DOM support - In dom.js need to make sure will work in all supported browsers

**Nice to-haves**

1. Karma unit tests - This library has extensive server side tests, but is lacking in automated client side tests.
1. Framework integrations - We are already working on an integration with Angular 1.x and Angular 2, but we
need help testing this out with Ember, React and other frameworks.
1. Browser support - So far I have only be testing on the latest version of Chrome. Need help to get working on
other browsers, especially IE.
1. Performance - No performance testing has been done yet. We likely need this at some point since the whole
goal here is to improve percieved performance.
1. Build time warning messages - Much better warning/error messages while attempting to build the preboot client
side code to help guide developers.
1. Docs and examples - Add stuff to help people use this library


