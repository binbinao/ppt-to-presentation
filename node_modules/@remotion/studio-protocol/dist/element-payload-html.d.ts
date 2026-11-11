import { type StudioElementPayload } from './element-payload';
export declare const ELEMENT_PAYLOAD_MIME_TYPE = "application/vnd.remotion.element+json";
export type ParsedElementPayloadsFromHtml = {
    readonly payloads: StudioElementPayload[];
    readonly invalidPayloadCount: number;
    readonly alternateHrefs: string[];
};
export declare const serializeElementPayloadForHtml: (payload: StudioElementPayload) => string;
export declare const parseElementPayloadsFromHtml: (html: string) => ParsedElementPayloadsFromHtml;
