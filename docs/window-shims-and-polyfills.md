# Window shims and polyfills.

Please consult the [gotchas](./gotchas.md), as it contains the preferred way to solve the problems where we need shims and polyfills.

As part of the default installation we now provide a sample file on how you can provide `window` and `document` shims to your universal application. This file serves as a starting point.

> ## Note
> Please be aware that using the global scope can lead to memory leaks and security issues.
> The shims and polyfills provided will not cause this by themselves, but if your application or any of its dependencies
> stores or modifies _anything_ that is in the global scope (this includes, but is not limited to `window` and `document`) you are at risk.


## Why

We see a lot of questions on ngUniversal that revolve around using 3rd party libraries. With this addition, we are providing a starting point to give you some samples and an idea on how to tackle issues related to using 3rd party libraries. We would like to emphasize that these techniques are a last-resort solution. The preferred way to deal with 3rd party libraries is by utilizing the Angular injector.

## Location

We have generated a file called `windows-shims-and-polyfiles.ts` in a subfolder of the location where `server.ts is` created.

## How

Because we need to compile your application's code for use in node, we need 3 types of helpers:
1. TypeScript shims
2. Node shims
3. node polyfills

Those are needed even if the code isn't used when your app is rendered during SSR as Universal still needs to read and compile all of the code in your application.

### 1. TypeScript shims

Since many applications will throw type errors while being compiled by Universal, TypeScript shims are needed. If the code inside the app is properly shielded by feature detection and doesn't run during SSR, TS might still complain about a missing type. This is the simplest kind of shim as it only involves the type system. When you look into the provided file, you will see:

```typescript
declare var global: {
  /** Reference to the window. */
  window: Window;
  /** Reference to the document. */
  document: Document;
  // ...
  /** Reference to SomeLibrary. (this would be added by you) */
  SomeLibrary: any;
  // ...
};
```

Lets take a theoretical `SomeLibrary` as an example. We just assign any to it in the shims and polyfills file, so that any reference in the code would not cause a TS compilation error. As we have properly used feature detection, in our application, (as shown in the following example) the code that is actually using the library is not called at all. However, Typescript is still compiling the code, and will error out if it's not available on the global scope.

when you look into the provided shims and polyfills file:
```typescript
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private elmRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
    ) {}

  ngOnInit(): void {
    /**
     * We need the element anyway, and the nativeElement is
     * only available in the browser, not during SSR!
     * So we can can use that as feature detection.
     */
    const elm = this.elmRef.nativeElement as HTMLElement;
    if (elm) {
      /** somehow we made SomeLibrary available in the browser */
      SomeLibrary.addExitingFunctionality(elm);
    }
    /** as an alternative you can check for the existence of the lib */
    if (SomeLibrary) {
      SomeLibrary.addExitingFunctionality(elm);
    }
    /**
     * Or use isPlatformBrowser. Don't forget to inject the platformId then.
     */
    if (isPlatformBrowser(this.platformId)) {
      SomeLibrary.addExitingFunctionality(elm);
    }    
  }
}
```

When you have a TypeScript error during compilation for SSR, start off with adding the missing type to the global decoration. The `any` type will do, but providing proper typing will help you discover problems sooner.

### 2. Node shims 

If your application uses any browser (or 3rd party) functionality that is not available in node, you may want to provide an empty stub function with the same type signature. Let's look at an example using the Event function which creates a new event. There is no way you can trigger that during SSR, so its needs to pass compilation, but nothing more.

```typescript
global.Event = window.Event = (function () {} as unknown) as ((n) =>Event);
```

This will allow your app to compile and run during SSR. 

> ## note
> Perhaps you noticed the: `global.Event = window.Event = ...` in the above sample.  
> We did that because in the browser, all the things on `window` are also available in the global namespace. As we don't have control over how our 3rth parties are using those, we need to provide both.

### 3. node polyfills

Node polyfills are used when there is no other way to get your application through the Universal compilation process. Let's look at an example of shimming for a legacy library that uses requestAnimationFrame in its init routine. This will crash during SSR if requestAnimationFrame is not present.

```typescript
global.requestAnimationFrame = window.requestAnimationFrame = (callback: FrameRequestCallback) => {
  setTimeout(() => callback(performance.now()))
  return 1
});
```

Here we mimic the `requestAnimationFrame` with a setTimout. We make sure the call signature is identical to what the browser provides. This is extremely delicate. When the application uses `requestAnimationFrame` recursively, SSR will be stuck in an endless loop. This sample was chosen to show the danger of this approach.


## conclusion

We provide this file, to help you get up and running with Universal. It shows how to shim, stub or polyfill missing browser or 3rd party libraries. It serves as a starting point, from which you can build your own SSR solution. However, make sure your app doesn't leak memory or compromise security using the provided globals. And make sure it is properly audited before you go to production.