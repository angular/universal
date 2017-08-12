import { Request, Response } from 'koa';
import { InjectionToken } from '@angular/core';

export const REQUEST = new InjectionToken<Request>('REQUEST');
export const RESPONSE = new InjectionToken<Response>('RESPONSE');
