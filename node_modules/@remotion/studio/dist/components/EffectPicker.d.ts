import React from 'react';
import { type TimelineSelection } from './Timeline/TimelineSelection';
export declare const EffectPicker: React.FC<{
    readonly selection: Extract<TimelineSelection, {
        type: 'sequence-all-effects';
    }>;
}>;
