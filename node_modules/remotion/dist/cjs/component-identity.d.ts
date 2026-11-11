import React from 'react';
type ComponentIdentityResolver = (component: unknown) => unknown;
export declare const setComponentIdentityResolver: (resolver: ComponentIdentityResolver | null) => void;
export declare const resolveComponentIdentity: (component: unknown) => unknown;
export declare const getSingleChildComponent: (children: React.ReactNode) => unknown;
export declare const getSingleChildProps: (children: React.ReactNode) => Record<string, unknown> | null;
export {};
