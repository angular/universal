# Angular Universal Express-Engine Schematics
A collection of Schematics for Angular Universal Express-Engine.

## Collection

### Install
Adds Angular Universal Express Engine and its depedencies and pre-configures the application. 

- Adds Express-Engine, NgModule-Factory-Loader, ts-loader, and webpack to `package.json`
- Adds a sample Express server file
- Ensure `BrowserAnimationsModule` is installed and included in root module
- Adds pre-configured theme to `.angular.json` file OR adds custom theme scaffolding to `styles.scss`

Command: `ng add @nguniversal/express-engine`