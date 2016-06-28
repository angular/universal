[![Build Status](https://travis-ci.org/angular/universal.svg?branch=master)](https://travis-ci.org/angular/universal)
[![npm version](https://badge.fury.io/js/angular2-universal.svg)](http://badge.fury.io/js/angular2-universal)
[![Join the chat at https://gitter.im/angular/universal](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/angular/universal?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Issue Stats](http://issuestats.com/github/angular/universal/badge/pr?style=flat)](http://issuestats.com/github/angular/universal)
[![Issue Stats](http://issuestats.com/github/angular/universal/badge/issue?style=flat)](http://issuestats.com/github/angular/universal)

<p align="center">
  
    <img src="https://cloud.githubusercontent.com/assets/1016365/10639063/138338bc-7806-11e5-8057-d34c75f3cafc.png" alt="Universal Angular 2" height="320"/>
  
</p>

# Universal Angular 2
> Universal (isomorphic) JavaScript support for Angular 2.

# Table of Contents
* [Getting Started with Universal](#getting-started)
    * w/ NodeJS Server
    * w/ ASP.NET Core Server
* [Modules](#modules)
    * [Universal](#universal)
    * [preboot.js](#prebootjs)
* [Best Practices](#best-practices)
* [What's in a name?](#whats-in-a-name)
* [License](#license)

# Getting Started

[* NodeJS :: Universal Starter repo](https://github.com/angular/universal-starter)

[* ASP.NET Core :: Universal Starter repo](https://github.com/aspnet/JavaScriptServices/tree/master/templates/Angular2Spa)


# Modules

## [Universal](/modules/universal)
> Manage your application lifecycle and serialize changes while on the server to be sent to the client.

### Documentation
[Design Doc](https://docs.google.com/document/d/1q6g9UlmEZDXgrkY88AJZ6MUrUxcnwhBGS0EXbVlYicY)

### Videos
Angular 2 Universal Patterns - ng-conf, May 2016  
[![Angular 2 Universal Patterns](http://img.youtube.com/vi/TCj_oC3m6_U/0.jpg)](https://www.youtube.com/watch?v=TCj_oC3m6_U)

Angular Universal Source Code - ReadTheSource, January 2016  
[![Angular Universal Source Code](http://img.youtube.com/vi/qOjtFjXoebY/0.jpg)](https://www.youtube.com/watch?v=qOjtFjXoebY)

Full Stack Angular 2 - AngularConnect, Oct 2015  
[![Full Stack Angular 2](https://img.youtube.com/vi/MtoHFDfi8FM/0.jpg)](https://www.youtube.com/watch?v=MtoHFDfi8FM)

Angular 2 Server Rendering - Angular U, July 2015  
[![Angular 2 Server Rendering](http://img.youtube.com/vi/0wvZ7gakqV4/0.jpg)](http://www.youtube.com/watch?v=0wvZ7gakqV4)

## [preboot.js](/modules/preboot)
> Control server-rendered page and transfer state before client-side web app loads to the client-side-app.

# Best Practices
> When building Universal components in Angular 2 there are a few things to keep in mind.

> Note: Universal versions 0.103.3 (or higher) work with the new alpha `router-3.0.0-alpha`. Prior versions work only with router-deprecated.

* Know the difference between attributes and properties in relation to the DOM.
* Don't manipulate the `nativeElement` directly. Use the `Renderer`. We do this to ensure that in any environment we're able to change our view.
```typescript
constructor(element: ElementRef, renderer: Renderer) {
  renderer.setElementStyle(element.nativeElement, 'font-size', 'x-large');
}
```
* Don't use any of the browser types provided in the global namespace such as `navigator` or `document`. Anything outside of Angular will not be detected when serializing your application into html. If you need access to these types please consider using `DOM` from `"angular2/src/platform/dom/dom_adapter"`
* Keep your directives stateless as much as possible. For stateful directives, you may need to provide an attribute that reflects the corresponding property with an initial string value such as `url` in `img` tag. For our native `<img src="">` element the `src` attribute is reflected as the `src` property of the element type `HTMLImageElement`. 

# What's in a name?
We believe that using the word "universal" is correct when referring to a JavaScript Application that runs in more environments than the browser. (inspired by [Universal JavaScript](https://medium.com/@mjackson/universal-javascript-4761051b7ae9))

# License
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](/LICENSE)
