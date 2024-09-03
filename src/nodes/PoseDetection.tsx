import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useEffect } from 'react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import Instructions from '../components/Instructions';
import { usePoseDetector } from '../components/PoseDetector';
import { isEqual } from 'lodash';
import ResizableNode from '../components/ResizableNode';
import { Form, Select } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { SupportedModels } from '@tensorflow-models/pose-detection';

export function PoseDetection({ id, selected, data }: NodeProps<Node<any, 'pose-detection'>>) {
    const setRuntimeNodeData = useRuntimeNodeStore(state => (nodeData: any) => state.set(id, nodeData));
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    const detector = usePoseDetector(SupportedModels.BlazePose, {
        runtime: 'mediapipe',
        modelType: data.modelType,
        solutionPath: 'node_modules/@mediapipe/pose'
    });
    useEffect(() => {
        if (detector) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), tensor => {
                if (tensor) {
                    detector.estimatePoses(tensor).then(poses => {
                        if (poses.length > 0) {
                            for (const pose of poses) {
                                if (pose.keypoints != null) {
                                    setRuntimeNodeData({ pose });
                                    break;
                                }
                            }
                        }
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
                        { id: "pose", label: '姿态数据' }
                    ]}
                />
                <Form
                    style={{ width }}
                    
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
                            { label: '高精度', value: 'heavy' },
                            { label: '全精度', value: 'full' },
                            { label: '精简', value: 'lite' },
                        ]} />
                    </Form.Item>
                </Form>
            </>}
        </ResizableNode>
    );
}
