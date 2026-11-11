"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleChildProps = exports.getSingleChildComponent = exports.resolveComponentIdentity = exports.setComponentIdentityResolver = void 0;
const react_1 = __importDefault(require("react"));
const is_inside_series_js_1 = require("./series/is-inside-series.js");
// Studio installs a resolver that maps refreshed component implementations to
// the stable family object maintained by React Refresh.
let componentIdentityResolver = null;
const setComponentIdentityResolver = (resolver) => {
    componentIdentityResolver = resolver;
};
exports.setComponentIdentityResolver = setComponentIdentityResolver;
const resolveComponentIdentity = (component) => {
    var _a;
    return (_a = componentIdentityResolver === null || componentIdentityResolver === void 0 ? void 0 : componentIdentityResolver(component)) !== null && _a !== void 0 ? _a : component;
};
exports.resolveComponentIdentity = resolveComponentIdentity;
const getSingleChildElement = (children) => {
    const mountedChildren = react_1.default.Children.toArray(children);
    if (mountedChildren.length !== 1) {
        return null;
    }
    const child = mountedChildren[0];
    if (!react_1.default.isValidElement(child)) {
        return null;
    }
    // Series inserts this transparent context boundary around its authored children.
    if (child.type === is_inside_series_js_1.IsNotInsideSeriesProvider) {
        return getSingleChildElement(child.props.children);
    }
    if (typeof child.type !== 'function' && typeof child.type !== 'object') {
        return null;
    }
    return child;
};
const getSingleChildComponent = (children) => {
    const child = getSingleChildElement(children);
    return child === null ? null : (0, exports.resolveComponentIdentity)(child.type);
};
exports.getSingleChildComponent = getSingleChildComponent;
const getSingleChildProps = (children) => {
    var _a;
    var _b;
    return ((_b = (_a = getSingleChildElement(children)) === null || _a === void 0 ? void 0 : _a.props) !== null && _b !== void 0 ? _b : null);
};
exports.getSingleChildProps = getSingleChildProps;
