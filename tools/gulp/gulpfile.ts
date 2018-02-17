import {createPackageBuildTasks} from 'lib-build-tools';
import {aspPackage, commonPackage, expressPackage, hapiPackage, mmnlPackage} from './packages';

/** Create gulp tasks to build the different packages in the project. */
createPackageBuildTasks(aspPackage);
createPackageBuildTasks(commonPackage);
createPackageBuildTasks(expressPackage);
createPackageBuildTasks(hapiPackage);
createPackageBuildTasks(mmnlPackage);

import './tasks/clean';
import './tasks/changelog';
import './tasks/ci';
import './tasks/default';
import './tasks/lint';
import './tasks/publish';
import './tasks/unit-test';
import './tasks/unit-test-server';
import './tasks/validate-release';
