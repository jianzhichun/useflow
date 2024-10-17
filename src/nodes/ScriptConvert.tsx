import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import ResizableNode from '../components/ResizableNode';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Form, Flex, Space, Button, Input } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useCallback, useEffect } from 'react';
import { isEqual } from 'lodash';

export function ScriptConvert({ id, selected, data }: NodeProps<Node<any, "script-convert">>) {
    const setRuntimeNodeData_ = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
    const setRuntimeNodeData = useCallback(setRuntimeNodeData_, [setRuntimeNodeData_]);
    const updateNodeInternals = useUpdateNodeInternals();
    const [form] = useForm();
    useEffect(() => {
        return useRuntimeNodeStore.subscribe(state => state.get(id, "input"), input => {
            if (input && data?.scripts) {
                data.scripts.map(({content}:any, idx: number) => {
                    setRuntimeNodeData({[`output${idx}`]:eval(content)})
                });
            }
        }, { equalityFn: isEqual });
    }, [data?.scripts]);
    return (
        <ResizableNode id={id} data={data} selected={selected}>
            {() => <>
                <UseHandle input={[{ id: "input", label: "输入" }]}></UseHandle>
                <Form
                    form={form}
                    initialValues={data}
                    autoComplete="off"
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.List name={"scripts"}>
                        {(fields, { add, remove }) => (<>
                            {fields.map(({ key, name, ...restField }) => {
                                return <Flex vertical key={key} >
                                    <Space style={{ justifyContent: 'space-between' }}>
                                        <Space>
                                            <Form.Item label="脚本" {...restField} name={[name, 'content']}>
                                                <Input.TextArea />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                        <UseHandle output={[{ id: `output${name}`, label: `输出${name}` }]} />
                                    </Space>
                                </Flex>;
                            })}
                            <Form.Item>
                                <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                    script: 'content',
                                })} >
                                    添加一项
                                </Button>
                            </Form.Item>
                        </>)}
                    </Form.List>
                </Form>
            </>}
        </ResizableNode>
    );
}
