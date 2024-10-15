import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useCallback, useEffect } from 'react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import Instructions from '../components/Instructions';
import { isEqual } from 'lodash';
import ResizableNode from '../components/ResizableNode';
import { Form, Select } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useHandPoseDetector } from '../components/HandPoseDetector';
import { SupportedModels } from '@tensorflow-models/hand-pose-detection';

export function HandPoseDetection({ id, selected, data }: NodeProps<Node<any, 'hand-pose-detection'>>) {
    const setRuntimeNodeData_ = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
    const setRuntimeNodeData = useCallback(setRuntimeNodeData_, [setRuntimeNodeData_]);
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    const detector = useHandPoseDetector(SupportedModels.MediaPipeHands, {
        runtime: 'mediapipe',
        modelType: data.modelType,
        solutionPath: 'node_modules/@mediapipe/hands'
    });
    useEffect(() => {
        if (detector) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), tensor => {
                if (tensor) {
                    detector.estimateHands(tensor).then(hands => {
                        setRuntimeNodeData({ hands });
                    });
                }
            }, { equalityFn: isEqual });
        }
    }, [detector]);
    return (
        <ResizableNode id={id} data={data} selected={selected}>
            {(width) => <>
                <Instructions width={width}>![](./pose-detection-lib/blazepose.png)</Instructions>
                <UseHandle
                    input={[{ id: "tensor", label: "视频流" }]}
                    output={[
                        { id: "hands", label: '手势数据' }
                    ]}
                />
                <Form
                    form={form}
                    initialValues={data}
                    autoComplete="off"
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.Item label="模型类型" name="modelType" >
                        <Select allowClear className="nodrag nopan" options={[
                            { label: '全精度', value: 'full' },
                            { label: '精简', value: 'lite' },
                        ]} />
                    </Form.Item>
                </Form>
            </>}
        </ResizableNode>
    );
}
