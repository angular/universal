/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
import { FastifyReply, FastifyRequest } from 'fastify';

export const REQUEST = new InjectionToken<FastifyRequest>('REQUEST');
export const REPLY = new InjectionToken<FastifyReply>('REPLY');
