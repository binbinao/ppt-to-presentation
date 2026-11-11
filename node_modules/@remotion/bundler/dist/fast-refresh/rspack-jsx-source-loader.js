"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const node_path_1 = __importDefault(require("node:path"));
const webpack_1 = require("webpack");
// The parser walks each module synchronously and restores its state afterwards.
const parser = new webpack_1.javascript.JavascriptParser('module');
const plugin = 'RemotionJsxSource';
const jsxDev = Symbol(plugin);
parser.hooks.importSpecifier.tap(plugin, (statement, source, imported, name) => {
    const { loc } = statement;
    const { mappings } = parser.state.jsxSources;
    // SWC's automatic runtime import has no authored mapping. A handwritten
    // import of the very same function has its own source location.
    if (source === 'react/jsx-dev-runtime' &&
        imported === 'jsxDEV' &&
        loc &&
        loc.start.line === loc.end.line &&
        mappings[loc.start.line - 1] === '') {
        parser.tagVariable(name, jsxDev);
        return true;
    }
});
parser.hooks.call.for(jsxDev).tap(plugin, (call) => {
    const source = call.arguments[4];
    const { file, insertions } = parser.state.jsxSources;
    if ((source === null || source === void 0 ? void 0 : source.type) === 'ObjectExpression' &&
        source.range &&
        source.properties.some((p) => p.type === 'Property' &&
            p.key.type === 'Identifier' &&
            p.key.name === 'fileName' &&
            p.value.type === 'Literal' &&
            p.value.value === file)) {
        insertions.push(source.range[0] + 1);
    }
});
const RspackJsxSourceLoader = function (code, inputMap, data) {
    var _a, _b;
    var _c, _d;
    const passThrough = () => this.callback(null, code, inputMap, data);
    if (!inputMap || !this._module || !this._compilation)
        return passThrough();
    const map = typeof inputMap === 'string' ? JSON.parse(inputMap) : inputMap;
    // The native SWC map describes one authored module. A composed or indexed
    // map supplied by an override cannot prove which bytes were compiled here.
    if (((_a = map.sources) === null || _a === void 0 ? void 0 : _a.length) !== 1 ||
        typeof map.mappings !== 'string' ||
        node_path_1.default.resolve(this.rootContext, (_c = map.sourceRoot) !== null && _c !== void 0 ? _c : '', map.sources[0]) !==
            this.resourcePath)
        return passThrough();
    const authored = (_b = map.sourcesContent) === null || _b === void 0 ? void 0 : _b[0];
    if (typeof authored !== 'string')
        return passThrough();
    const jsxSources = {
        file: this.resourcePath,
        mappings: map.mappings.split(';'),
        insertions: [],
    };
    try {
        parser.parse(code, {
            source: code,
            module: this._module,
            current: this._module,
            compilation: this._compilation,
            options: this._compilation.options,
            jsxSources,
        });
    }
    catch (_e) {
        // An override can supply syntax which this parser does not recognize.
        return passThrough();
    }
    if (jsxSources.insertions.length === 0)
        return passThrough();
    const hash = (0, node_crypto_1.createHash)('sha256').update(authored).digest('hex');
    const changed = new webpack_1.sources.ReplaceSource(new webpack_1.sources.SourceMapSource(code, this.resourcePath, map));
    for (const index of jsxSources.insertions) {
        changed.insert(index, `__remotionCompiledSourceHash:"${hash}",`);
    }
    const result = changed.sourceAndMap();
    this.callback(null, result.source, (_d = result.map) !== null && _d !== void 0 ? _d : inputMap, data);
};
exports.default = RspackJsxSourceLoader;
