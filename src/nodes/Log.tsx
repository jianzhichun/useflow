import { NodeProps } from '@xyflow/react';
import { type Log } from './types';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../App';
import Markdown from '../components/Markdown';
import ResizableNode from '../components/ResizableNode';
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
        <ResizableNode data={data} selected={selected}>
            {() => <>
                <UseHandle input={[{ id: "log", label: "日志" }]}></UseHandle>
                {renderLog()}
            </>}
        </ResizableNode>
    );
}
