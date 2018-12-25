/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element} from 'protractor';

import {verifyNoBrowserErrors} from './util';

describe('Hello world E2E Tests', function() {
  it('should display: Hello world!', function() {
    // Load the page without waiting for Angular since it is not bootstrapped automatically.
    browser.driver.get(browser.baseUrl + 'helloworld');

    const style = browser.driver.findElement(by.css('style[ng-transition="hlw"]'));
    expect(style.getText()).not.toBeNull();

    // Test the contents from the server.
    const serverDiv = browser.driver.findElement(by.css('div'));
    expect(serverDiv.getText()).toMatch('Hello world!');

    // Bootstrap the client side app.
    browser.executeScript('doBootstrap()');

    // Retest the contents after the client bootstraps.
    expect(element(by.css('div')).getText()).toMatch('Hello world!');

    // Make sure the server styles got replaced by client side ones.
    expect(element(by.css('style[ng-transition="hlw"]')).isPresent()).toBeFalsy();
    expect(element(by.css('style')).getText()).toMatch('');

    // Make sure there were no client side errors.
    verifyNoBrowserErrors();
  });

  xit('should display: im lazy', function() {
    // Load the page without waiting for Angular since it is not bootstrapped automatically.
    browser.driver.get(browser.baseUrl + 'helloworld/lazy');

    const style = browser.driver.findElement(by.css('style[ng-transition="hlw"]'));
    expect(style.getText()).not.toBeNull();

    // Test the contents from the server.
    const serverDiv = browser.driver.findElement(by.css('h3'));
    expect(serverDiv.getText()).toMatch('im lazy');

    // Bootstrap the client side app.
    browser.executeScript('doBootstrap()');

    // Retest the contents after the client bootstraps.
    expect(element(by.css('h3')).getText()).toMatch('im lazy');

    // Make sure the server styles got replaced by client side ones.
    expect(element(by.css('style[ng-transition="hlw"]')).isPresent()).toBeFalsy();
    expect(element(by.css('style')).getText()).toMatch('');

    // Make sure there were no client side errors.
    verifyNoBrowserErrors();
  });

  it('should populate window.location', () => {
    browser.driver.get(browser.baseUrl + 'helloworld');

    browser.executeScript('return window.location;').then((location: Location) => {
      expect(location.href).toEqual('http://localhost:9876/helloworld');
      expect(location.origin).toEqual('http://localhost:9876');
    });
  });
});
