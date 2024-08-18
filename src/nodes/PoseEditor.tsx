import { NodeProps, NodeResizer, ResizeParams } from '@xyflow/react';
import { type PoseEditor } from './types';
import { useRuntimeNodeDataStore } from '../App';
import { UseHandle } from './components/UseHandle';
import { useState } from 'react';


// 定义三维坐标类型
type Point3D = {
    x: number;
    y: number;
    z: number;
};

function calculate3DAngle(a: Point3D, b: Point3D, c: Point3D): number {
    const ab = {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
    const bc = {x: b.x - c.x, y: b.y - c.y, z: b.z - c.z};
    const dotProduct = ab.x * bc.x + ab.y * bc.y + ab.z * bc.z;
    const magnitudeAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y + ab.z * ab.z);
    const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);
    const angleInRadians = Math.acos(dotProduct / (magnitudeAB * magnitudeBC));
    return angleInRadians * (180 / Math.PI);
}
export function PoseEditor({ id, selected, data }: NodeProps<PoseEditor>) {
    const minWidth = 200;
    const [width, setWidth] = useState(minWidth);
    const poses = useRuntimeNodeDataStore((state: any) => state.getInputParam(id, "poses"));

    return <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
        <NodeResizer minWidth={minWidth} isVisible={selected || false} onResizeEnd={(_, { width }: ResizeParams) => { setWidth(width) }} />
        <div>姿势编辑</div>
        <UseHandle
            input={[{ id: "poses", label: "姿态数据" }]}
        />
        {JSON.stringify(poses)}
    </div>;
}