"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenTimelineFrameRate = void 0;
const getOpenTimelineFrameRate = (contents) => {
    let timeline;
    try {
        timeline = JSON.parse(contents);
    }
    catch (_a) {
        return null;
    }
    const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
    const getRate = (value) => isRecord(value) &&
        value.OTIO_SCHEMA === 'RationalTime.1' &&
        typeof value.rate === 'number' &&
        Number.isFinite(value.rate) &&
        value.rate > 0
        ? value.rate
        : null;
    if (!isRecord(timeline) || timeline.OTIO_SCHEMA !== 'Timeline.1') {
        return null;
    }
    const timelineRate = getRate(timeline.global_start_time);
    if (timelineRate !== null) {
        return timelineRate;
    }
    const rates = [];
    const visit = (value) => {
        var _a, _b;
        if (!isRecord(value)) {
            return;
        }
        let range = value.source_range;
        if (!isRecord(range) &&
            ['Clip.1', 'Clip.2'].includes(String(value.OTIO_SCHEMA))) {
            const reference = value.OTIO_SCHEMA === 'Clip.2' &&
                isRecord(value.media_references) &&
                typeof ((_a = value.active_media_reference_key) !== null && _a !== void 0 ? _a : 'DEFAULT_MEDIA') ===
                    'string'
                ? value.media_references[((_b = value.active_media_reference_key) !== null && _b !== void 0 ? _b : 'DEFAULT_MEDIA')]
                : value.media_reference;
            range = isRecord(reference) ? reference.available_range : null;
        }
        if (isRecord(range)) {
            for (const time of [range.start_time, range.duration]) {
                const rate = getRate(time);
                if (rate !== null)
                    rates.push(rate);
            }
        }
        else if (value.OTIO_SCHEMA === 'Gap.1' ||
            value.OTIO_SCHEMA === 'Filler.1') {
            const rate = getRate(value.duration);
            if (rate !== null)
                rates.push(rate);
        }
        if (Array.isArray(value.children)) {
            value.children.forEach(visit);
        }
    };
    visit(timeline.tracks);
    const firstRate = rates[0];
    if (firstRate === undefined) {
        return null;
    }
    return rates.every((rate) => Math.abs(rate - firstRate) < firstRate * 1e-8)
        ? firstRate
        : null;
};
exports.getOpenTimelineFrameRate = getOpenTimelineFrameRate;
