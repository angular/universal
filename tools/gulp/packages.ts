import {BuildPackage} from 'lib-build-tools';

export const aspPackage = new BuildPackage('aspnetcore-engine', []);
export const commonPackage = new BuildPackage('common');
export const expressPackage = new BuildPackage('express-engine', []);
export const hapiPackage = new BuildPackage('hapi-engine', []);
export const mmnlPackage = new BuildPackage('module-map-ngfactory-loader',[]);
