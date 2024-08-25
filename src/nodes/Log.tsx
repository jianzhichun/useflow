import { NodeProps, NodeResizer } from '@xyflow/react';
import { type Log } from './types';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../App';
import EditableTitle from '../components/EditableTitle';
import Markdown from '../components/Markdown';
export function Log({ id, selected, data }: NodeProps<Log>) {
    const log = useRuntimeNodeStore(state => state.get(id, "log"));
    const renderLog = () => {
        if (typeof log === "string") {
            return <Markdown>{log}</Markdown>;
        } else if (typeof log === "object") {
            return <Markdown>{JSON.stringify(log, null, 2)}</Markdown>;
        } else {
            return <>未知类型</>;
        }
    }
    return (
        <div className="react-flow__node-default">
            <NodeResizer isVisible={selected || false} />
            <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
            <UseHandle input={[{ id: "log", label: "日志" }]}></UseHandle>
            {renderLog()}
        </div>
    );
}
