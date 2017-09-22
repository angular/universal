// The CLI requires this file to run tests

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from "./app.module";

platformBrowserDynamic().bootstrapModule(AppModule);
