import { NodeProps, NodeResizer, useUpdateNodeInternals } from "@xyflow/react";
import { useRuntimeNodeStore } from "../App";
import UseHandle from "../components/UseHandle";
import { type PoseArrangement } from './types';
import { useForm } from "antd/es/form/Form";
import { Button, Flex, Form, Input, InputNumber, Select, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import EditableTitle from "../components/EditableTitle";
import { useState } from "react";

export function PoseFrame({ nodeId, idx, restField, remove, frames }: any) {
    const [configVisible, setConfigVisible] = useState(false);
    return <Flex vertical>
        <Space align="baseline">
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "name"]} label="名称">
                <Input />
            </Form.Item>
            <MinusCircleOutlined onClick={remove} />
        </Space>
        <UseHandle input={[{
            id: `score${idx}`, label: <>
                得分{idx + 1}
                <Button onClick={() => setConfigVisible(old => !old)} size="small" type="link">
                    配置
                </Button>
            </>
        }]} />
        {configVisible && <>
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "wait"]} label="等待时间">
                <InputNumber suffix="秒" />
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

export function PoseArrangement({ id, selected, data }: NodeProps<PoseArrangement>) {
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    const params = useRuntimeNodeStore((state) => state.get(id));
    return (
        <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
            <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
            <NodeResizer isVisible={selected || false} />
            <UseHandle output={[{ id: 'frame', label: '帧' }]} />
            <Form
                size="small"
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
                                return <PoseFrame frames={form.getFieldValue("frames")} key={key} nodeId={id} idx={name} restField={restField} remove={() => remove(name)} />
                            })}
                            <Form.Item>
                                <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                    wait: 3,
                                    name: `姿势${fields.length + 1}`,
                                    minScore: 85,
                                    rollback: 0,
                                    scoreFormat: 'percentage'
                                })} >
                                    添加一项
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </div>
    );
}