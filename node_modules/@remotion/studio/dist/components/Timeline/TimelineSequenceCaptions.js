"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineSequenceCaptions = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const use_runtime_values_1 = require("../../helpers/use-runtime-values");
const timeline_sequence_label_1 = require("./timeline-sequence-label");
const TimelineSequenceCaptions = ({ s, source, startMs, endMs }) => {
    const selectTranscript = (0, react_1.useCallback)((values) => {
        const value = source.type === 'static' ? source.value : values[source.key];
        const captions = Array.isArray(value) ? value : [];
        return captions
            .filter((caption) => endMs > startMs &&
            caption.endMs > startMs &&
            caption.startMs < endMs)
            .map((caption, index, visible) => {
            const next = visible[index + 1];
            return caption.pageBreakAfter &&
                next &&
                !/\s$/.test(caption.text) &&
                !/^\s/.test(next.text)
                ? `${caption.text} `
                : caption.text;
        })
            .join('')
            .trim();
    }, [endMs, source, startMs]);
    const transcript = (0, use_runtime_values_1.useRuntimeValueSelector)({
        controls: source.type === 'runtime' ? s.controls : null,
        selector: selectTranscript,
    });
    return ((0, jsx_runtime_1.jsx)(timeline_sequence_label_1.TimelineSequenceLabel, { label: transcript, children: transcript }));
};
exports.TimelineSequenceCaptions = TimelineSequenceCaptions;
