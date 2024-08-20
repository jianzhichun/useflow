import { NodeProps, NodeResizer } from "@xyflow/react";
import { useRuntimeNodeStore } from "../App";
import UseHandle from "../components/UseHandle";
import { type Render } from './types';

export function Render({ id, selected, data }: NodeProps<Render>) {
    const score = useRuntimeNodeStore((state) => state.get(id, "score"));
    return (
        <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
             <UseHandle input={[{ id: "score", label: "得分" }]} />
             <NodeResizer isVisible={selected || false} />
            <div>{score}</div>
        </div>
    );
}