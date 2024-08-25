import { NodeResizer, ResizeParams } from '@xyflow/react';
import EditableTitle from './EditableTitle';
import { useState } from 'react';

interface ResizableNodeProps {
    selected?: boolean;
    minWidth?: number;
    minHeight?: number;
    data: { [k: string]: any };
    children: (width: number, height: number) => JSX.Element;
}

export default function ({ selected, minWidth = 200, minHeight = 100, data, children }: ResizableNodeProps) {
    const [width, setWidth] = useState(minWidth);
    const [height, setHeight] = useState(minHeight);
    return <div className="react-flow__node-default">
        <NodeResizer minWidth={minWidth} minHeight={minHeight} isVisible={selected || false} onResizeEnd={(_, { width, height }: ResizeParams) => { setWidth(width); setHeight(height); }} />
        <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
        {children(width, height)}
    </div>;
}