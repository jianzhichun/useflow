import { Handle, Position } from "@xyflow/react";

export function OutputHandle({ label, id, onConnect }: any) {
    return <div style={{ position: "relative" }}>
        {label}&nbsp;
        <Handle id={id} type="source" onConnect={onConnect} position={Position.Right}></Handle>
    </div>;
}
export function InputHandle({ label, id, onConnect }: any) {
    return <div style={{ position: "relative" }}>
        &nbsp;{label}
        <Handle id={id} type="target" onConnect={onConnect} position={Position.Left}></Handle>
    </div>;
}

export default function({ input, output }: any) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
                {input && input.map(({ label, id, onConnect }: any) => <InputHandle key={id} label={label} id={id} onConnect={onConnect}></InputHandle>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {output && output.map(({ label, id, onConnect }: any) => <OutputHandle key={id} label={label} id={id} onConnect={onConnect}></OutputHandle>)}
            </div>
        </div>
    );
}