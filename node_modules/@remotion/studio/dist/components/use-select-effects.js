"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelectEffects = void 0;
const react_1 = require("react");
const browser_studio_operations_1 = require("../helpers/browser-studio-operations");
const sidebar_1 = require("../state/sidebar");
const TimelineSelection_1 = require("./Timeline/TimelineSelection");
const useSelectEffects = () => {
    const currentSelection = (0, TimelineSelection_1.useCurrentTimelineSelectionStateAsRef)();
    const sidebar = (0, react_1.useContext)(sidebar_1.SidebarContext);
    const sidebarRef = (0, react_1.useRef)(sidebar);
    sidebarRef.current = sidebar;
    return (0, react_1.useCallback)((nodePathInfo) => {
        if (!nodePathInfo.supportsEffects ||
            !currentSelection.current.canSelect ||
            !(0, browser_studio_operations_1.canUseEffectOperations)()) {
            return false;
        }
        currentSelection.current.selectItems([
            {
                type: 'sequence-all-effects',
                nodePathInfo: { ...nodePathInfo, auxiliaryKeys: ['effects'] },
            },
        ], { reveal: true });
        if (sidebarRef.current.sidebarCollapsedStateRight === 'collapsed') {
            sidebarRef.current.setSidebarCollapsedState({
                left: null,
                right: 'expanded',
            });
        }
        else if (sidebarRef.current.sidebarCollapsedStateRight === 'responsive') {
            sidebarRef.current.setRightSidebarTemporaryExpansion(true);
        }
        return true;
    }, [currentSelection]);
};
exports.useSelectEffects = useSelectEffects;
