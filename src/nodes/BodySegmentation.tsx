import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { useEffect } from 'react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import Instructions from '../components/Instructions';
import { isEqual } from 'lodash';
import ResizableNode from '../components/ResizableNode';
import { Form, Select } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useBodySegmenter } from '../components/BodySegmenter';
import { SupportedModels } from '@tensorflow-models/body-segmentation';
import { useTfjs } from '../components/Tfjs';
import type { Node } from '@xyflow/react';

export function BodySegmentation({ id, selected, data }: NodeProps<Node<any, 'body-segmentation'>>) {
    const setRuntimeNodeData = useRuntimeNodeStore(state => (nodeData: any) => state.set(id, nodeData));
    const [form] = useForm();
    const tf = useTfjs();
    const updateNodeInternals = useUpdateNodeInternals();
    const bodySegmenter = useBodySegmenter(SupportedModels.MediaPipeSelfieSegmentation, {
        runtime: 'mediapipe',
        modelType: data.modelType,
        solutionPath: 'node_modules/@mediapipe/selfie_segmentation'
    });
    useEffect(() => {
        if (tf && bodySegmenter) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), tensor => {
                if (tensor) {
                    bodySegmenter.segmentPeople(tensor, { multiSegmentation: true, flipHorizontal: false }).then((segmentations) => {
                        segmentations.forEach(segmentation => segmentation.mask.toTensor().then((mask) => {
                            const binaryMask = tf.greater(tf.mean(mask, 2), tf.scalar(0.5));
                            const tensorWithoutBG = tf.mul(tensor, tf.expandDims(binaryMask, -1));
                            setRuntimeNodeData({ mask, tensorWithoutBG });
                        }));
                    });
                }
            }, { equalityFn: isEqual });
        }
    }, [tf, bodySegmenter]);
    return (
        <ResizableNode id={id} data={data} selected={selected}>
            {(width) => <>
                <Instructions width={width}>![](./pose-detection-lib/blazepose.png)</Instructions>
                <UseHandle
                    input={[{ id: "tensor", label: "视频流" }]}
                    output={[
                        { id: "mask", label: '分割掩码' },
                        { id: "tensorWithoutBG", label: '无背景视频流' }
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
                            { label: 'general', value: 'general' },
                            { label: 'landscape', value: 'landscape' },
                        ]} />
                    </Form.Item>
                </Form>
            </>}
        </ResizableNode>
    );
}
