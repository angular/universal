import { Type, NgModuleRef, ApplicationRef, Provider } from '@angular/core';
import { platformDynamicServer, PlatformState } from '@angular/platform-server';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/first';

export function ngAspnetCoreEngine(
    providers: Provider[],
    ngModule: Type<{}>
): Promise<{ html: string, globals: { styles: string, title: string, meta: string, [key:string]: any } }> {

    return new Promise((resolve, reject) => {

        const platform = platformDynamicServer(providers);

        return platform.bootstrapModule(<Type<{}>>ngModule).then((moduleRef: NgModuleRef<{}>) => {

            const state: PlatformState = moduleRef.injector.get(PlatformState);
            const appRef: ApplicationRef = moduleRef.injector.get(ApplicationRef);

            appRef.isStable
                .filter((isStable: boolean) => isStable)
                .first()
                .subscribe(() => {

                    // Fire the TransferCache
                    const bootstrap = moduleRef.instance['ngOnBootstrap'];
                    bootstrap && bootstrap();

                    // The parse5 Document itself
                    const AST_DOCUMENT = state.getDocument();

                    // Strip out the Angular application
                    const htmlDoc = state.renderToString();
                    const APP_HTML = htmlDoc.substring(
                        htmlDoc.indexOf('<body>') + 6,
                        htmlDoc.indexOf('</body>')
                    );

                    // Strip out Styles / Meta-tags / Title
                    const STYLES = [];
                    const META = [];
                    const LINKS = [];
                    let TITLE = '';

                    const HEAD = AST_DOCUMENT.head;

                    let count = 0;

                    for (let i = 0; i < HEAD.children.length; i++) {
                        let element = HEAD.children[i];

                        if (element.name === 'title') {
                            TITLE = element.children[0].data;
                        }

                        if (element.name === 'style') {
                            let styleTag = '<style ';
                            for (let key in element.attribs) {
                                styleTag += `${key}="${element.attribs[key]}">`;
                            }

                            styleTag += `${element.children[0].data}</style>`;
                            STYLES.push(styleTag);
                        }

                        if (element.name === 'meta') {
                            count = count + 1;
                            console.log(`\n\n\n ******* Meta count = ${count}`);
                            let metaString = '<meta';
                            for (let key in element.attribs) {
                                metaString += ` ${key}="${element.attribs[key]}"`;
                            }
                            META.push(`${metaString} />\n`);
                        }

                        if (element.name === 'link') {
                            let linkString = '<link';
                            for (let key in element.attribs) {
                                linkString += ` ${key}="${element.attribs[key]}"`;
                            }
                            LINKS.push(`${linkString} />\n`);
                        }
                    }

                    resolve({
                        html: APP_HTML,
                        globals: {
                            styles: STYLES.join(' '),
                            title: TITLE,
                            meta: META.join(' '),
                            links: LINKS.join(' ')
                        }
                    });

                    moduleRef.destroy();

                });
        }).catch(err => {
            reject(err);
        });

    });
}
