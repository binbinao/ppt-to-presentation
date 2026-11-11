import type React from 'react';
export type CanvasDomProps = React.AriaAttributes & Record<`data-${string}`, string | undefined>;
export declare const getCanvasPropsFromSequenceProps: (props: Record<string, unknown>) => CanvasDomProps;
