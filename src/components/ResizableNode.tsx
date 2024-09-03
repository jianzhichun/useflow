import { NodeResizer, ResizeParams, useReactFlow } from '@xyflow/react';
import EditableTitle from './EditableTitle';
import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface ResizableNodeProps {
    id: string;
    selected?: boolean;
    minWidth?: number;
    minHeight?: number;
    data: { [k: string]: any };
    children: (width: number, height: number) => JSX.Element;
}

export default function ({ id, selected, minWidth = 200, minHeight = 100, data, children }: ResizableNodeProps) {
    const [width, setWidth] = useState(minWidth);
    const [height, setHeight] = useState(minHeight);
    const { setNodes } = useReactFlow();

    return <div className="react-flow__node-default">
        {selected && <Button size='small' style={{
            position: 'absolute', 
            top: 0, right: 0,
            transform: `translate(100%, -100%)`,
            fontSize: 12,
            pointerEvents: 'all',
        }} shape="circle" type='dashed' onClick={(e) => {
            e.preventDefault();
            setNodes((nodes) => nodes.filter((node) => node.id !== id));
        }} icon={<CloseOutlined />} />}
        <NodeResizer minWidth={minWidth} minHeight={minHeight} isVisible={selected || false} onResizeEnd={(_, { width, height }: ResizeParams) => { setWidth(width); setHeight(height); }} />
        <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
        {children(width, height)}
    </div>;
}