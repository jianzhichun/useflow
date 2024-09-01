import { NodeProps, useUpdateNodeInternals } from "@xyflow/react";
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import UseHandle from "../components/UseHandle";
import { useForm } from "antd/es/form/Form";
import { Button, Flex, Form, Input, InputNumber, Select, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";
import "./ActionArrangement.css"
import ResizableNode from "../components/ResizableNode";
import type { Node } from '@xyflow/react';

export function PoseFrame({ nodeId, idx, restField, remove, frames }: any) {
    const [configVisible, setConfigVisible] = useState(false);
    const frame = useRuntimeNodeStore((state) => state.get(nodeId, 'frame'));
    return <Flex vertical className={idx === frame?.currFrame && "flashing-border" || ""}>
        <Space align="baseline">
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "name"]} label="名称">
                <Input />
            </Form.Item>
            <MinusCircleOutlined onClick={remove} />
        </Space>
        <UseHandle input={[{
            id: `score${idx}`, label: <>
                得分{idx + 1}
                <Button onClick={() => setConfigVisible(old => !old)} type="link">
                    配置
                </Button>
            </>
        }]} />
        {configVisible && <>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "wait"]} label={<>
                等待时间
                {idx === frame?.currFrame && frame?.remainTime && <span style={{ color: 'red' }}>&nbsp;{frame.remainTime.toFixed(0)}</span>}
            </>}>
                <InputNumber suffix="秒" />
            </Form.Item>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "waitStrategy"]} label="等待策略">
                <Select options={[
                    { value: "wait_next", label: "等待判断" },
                    { value: "condition_next", label: "条件判断" }
                ]} />
            </Form.Item>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "minScore"]} label="最低得分">
                <InputNumber />
            </Form.Item>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "rollback"]} label="失败回滚">
                <Select options={frames.map(({ name }: any, idx: number) => ({ value: idx, label: name }))} />
            </Form.Item>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "scoreFormat"]} label="分数格式">
                <Select options={[
                    { value: "percentage", label: "百分制" },
                    { value: "a-f", label: "等级制(A-F)" },
                    { value: "pf", label: "通过失败制" }
                ]} />
            </Form.Item>
        </>}
    </Flex>;
}
function getGrade(score: number) {
    if (score >= 90) {
        return 'A';
    } else if (score >= 80) {
        return 'B';
    } else if (score >= 70) {
        return 'C';
    } else if (score >= 60) {
        return 'D';
    } else {
        return 'F';
    }
}
function formatScore(scoreFormat: string, score: number) {
    switch (scoreFormat) {
        case "a-f":
            return getGrade(score);
        case "pf":
            return `${score >= 60 ? "通过" : "失败"}`;
        case "percentage":
        default:
            return score.toFixed(2);
    }
}
export function ActionArrangement({ id, selected, data }: NodeProps<Node<any, 'action-arrangement'>>) {
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    const setRuntimeNodeData = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
    useEffect(() => {
        if (!form) {
            return;
        }
        let checkFrame = 0;
        let checkStartTime = Date.now();
        return useRuntimeNodeStore.subscribe(state => state.get(id), (params) => {
            const { frames } = form.getFieldsValue();
            if (frames.length > 0) {
                if (checkFrame >= frames.length) {
                    checkFrame = 0;
                }
                const currFrame = checkFrame;
                const { name, wait, waitStrategy, minScore, rollback, scoreFormat } = frames[checkFrame];
                const currentTime = Date.now();
                const elapsedTime = (currentTime - checkStartTime) / 1000;
                const currScore = params?.[`score${checkFrame}`];
                let state = '校验';
                if (currScore) {
                    switch (waitStrategy) {
                        case "wait_next":
                            if (elapsedTime >= wait) {
                                if (currScore >= minScore) {
                                    checkFrame++;
                                    state = '成功';
                                } else {
                                    checkFrame = rollback;
                                    state = '失败';
                                }
                                checkStartTime = Date.now();
                            }
                            break;
                        case "condition_next":
                        default:
                            if (currScore >= minScore) {
                                checkFrame++;
                                state = '成功';
                                checkStartTime = Date.now();
                            }
                            if (elapsedTime >= wait) {
                                checkFrame = rollback;
                                state = '失败';
                                checkStartTime = Date.now();
                            }
                            break;
                    }
                }
                setRuntimeNodeData({
                    frame: {
                        name,
                        state,
                        currScore,
                        minScore,
                        formatScore: currScore && formatScore(scoreFormat, Math.max(0, currScore)),
                        elapsedTime,
                        currentTime,
                        remainTime: Math.max(wait - elapsedTime, 0),
                        currFrame
                    }
                });
            }
        }, { equalityFn: isEqual });
    }, [form]);
    return (
        <ResizableNode data={data} selected={selected}>
            {() => <>
                <UseHandle output={[{ id: 'frame', label: '信息帧' }]} />
                <Form
                    form={form}
                    initialValues={data}
                    autoComplete="off"
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.List name={"frames"}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => {
                                    return <PoseFrame nodeId={id} frames={form.getFieldValue("frames")} key={key} idx={name} restField={restField} remove={() => remove(name)} />
                                })}
                                <Form.Item>
                                    <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                        wait: 3,
                                        waitStrategy: 'condition_next',
                                        name: `行为${fields.length + 1}`,
                                        minScore: 85,
                                        rollback: fields.length - 1,
                                        scoreFormat: 'percentage'
                                    })} >
                                        添加一项
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </>}
        </ResizableNode>
    );
}