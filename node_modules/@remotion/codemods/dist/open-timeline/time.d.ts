export declare class OpenTimelineTime {
    private readonly numerator;
    private readonly denominator;
    private constructor();
    static fromNumber(value: number): OpenTimelineTime;
    add(other: OpenTimelineTime): OpenTimelineTime;
    subtract(other: OpenTimelineTime): OpenTimelineTime;
    multiply(value: number): OpenTimelineTime;
    divide(value: number): OpenTimelineTime;
    compare(other: OpenTimelineTime): number;
    toNumber(): number;
    ceil(): number;
}
export declare const ZERO_TIME: OpenTimelineTime;
