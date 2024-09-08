import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import ResizableNode from '../components/ResizableNode';
import { Button, Flex, Form, InputNumber, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { poseJoint } from './VideoRender';
import UseHandle from '../components/UseHandle';
import { useRef } from 'react';
import { useDeepCompareEffect } from 'ahooks';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import * as posedetection from '@tensorflow-models/pose-detection';
import { normalizeWeights, weightedManhattanSimilarity } from './PoseValidator';

function Offset({ idx, restField, remove }: any) {
    return <>
        <Flex vertical>
            <Space align='baseline'>
                <Form.Item {...restField} name={[idx, "joint"]} >
                    <Select className="nodrag nopan" options={poseJoint} />
                </Form.Item>
                离
                <Form.Item {...restField} name={[idx, "tlbr"]} >
                    <Select className='nodrag nopan' options={[
                        { label: "视口上界", value: "t" },
                        { label: "视口左界", value: "l" },
                        { label: "视口下界", value: "b" },
                        { label: "视口右界", value: "r" },
                    ]} />
                </Form.Item>
                小于
                <Form.Item {...restField} name={[idx, "value"]} >
                    <InputNumber suffix='%' className='nodrag nopan' style={{ width: 60 }} min={0} />
                </Form.Item>
                <MinusCircleOutlined onClick={remove} />
            </Space>
        </Flex>
    </>;
}

function Score({ nodeId, offsets }: any) {
    const score = useRef<number | null>(null);
    const setRuntimeNodeData = useRuntimeNodeStore((state) => (nodeData: any) => state.set(nodeId, nodeData));
    useDeepCompareEffect(() => {
        return useRuntimeNodeStore.subscribe(state => state.get(nodeId, "pose"), pose => {
            if (pose?.keypoints && pose?.shape && offsets) {
                const keypoints: posedetection.Keypoint[] = pose.keypoints;
                const [height, width] = pose?.shape;
                let A: number[] = [], B: number[] = [], weightsValue: number[] = [];
                offsets.forEach(({ joint, tlbr, value }: any) => {
                    let realtimeOffset: number;
                    switch (tlbr) {
                        case 't':
                            realtimeOffset = keypoints?.[joint]?.y / height;
                            break;
                        case 'b':
                            realtimeOffset = (height - keypoints?.[joint]?.y) / height;
                            break;
                        case 'l':
                            realtimeOffset = keypoints?.[joint]?.x / width;
                            break;
                        case 'r':
                        default:
                            realtimeOffset = (width - keypoints?.[joint]?.x) / width;
                            break;
                    }
                    A.push(realtimeOffset);
                    B.push(value / 100);
                    weightsValue.push(1);
                });
                let score_ = weightedManhattanSimilarity(A, B, normalizeWeights(weightsValue), 1);
                score_ = 100 * score_;
                score.current = Math.max(0, score_);
                setRuntimeNodeData({ score: score_ });
            }
        });
    }, [offsets]);
    return score.current && score.current.toFixed(1);
}

export function JointOffset({ id, selected, data }: NodeProps<Node<any, 'joint-offset'>>) {
    const updateNodeInternals = useUpdateNodeInternals();
    return <ResizableNode id={id} data={data} selected={selected} minWidth={300}>
        {(width, height) => <>
            <UseHandle input={[{
                id: "pose", label: <span>
                    姿态数据
                </span>
            }]} output={[{
                id: "score", label: <span>
                    得分
                    <sup style={{ color: 'red' }}>
                        <Score nodeId={id} offsets={data?.offsets} ></Score>
                    </sup>
                </span>
            }]} />
            <Form
                style={{ width }}
                initialValues={data}
                autoComplete="off"
                onValuesChange={(changedValues, values) => {
                    Object.assign(data, values);
                    updateNodeInternals(id);
                }}
            >
                <Form.List name={"offsets"}>
                    {(fields, { add, remove }) => (<>
                        {fields.map(({ key, name, ...restField }) => {
                            return <Offset
                                key={key} idx={name} restField={restField}
                                remove={() => remove(name)}
                            />
                        })}
                        <Form.Item>
                            <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() =>
                                add({ joint: 23, tlbr: 'r', value: '3' })
                            } >添加一项</Button>
                        </Form.Item>
                    </>)}
                </Form.List>
            </Form>
        </>}
    </ResizableNode>;
}