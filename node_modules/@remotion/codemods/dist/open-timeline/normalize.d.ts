import type { NormalizedOpenTimeline } from './types';
/** Read the OTIO JSON model without probing assets or depending on wall-clock state. */
export declare const normalizeOpenTimeline: (timeline: unknown) => NormalizedOpenTimeline;
