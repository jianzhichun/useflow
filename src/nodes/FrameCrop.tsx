import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import ResizableNode from '../components/ResizableNode';
import UseHandle from '../components/UseHandle';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toPixels, useTfjs } from '../components/Tfjs';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import { isEqual } from 'lodash';
import { Button, Flex, Form, InputNumber, Space, Switch } from 'antd';
import { useThrottleFn } from 'ahooks';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

function Crop({ idx, restField, remove, maxWidth, maxHeight }: any) {
    const [configVisible, setConfigVisible] = useState(false);
    return <>
        <UseHandle output={[{
            id: `param${idx}`, label: <>
                <MinusCircleOutlined onClick={remove} />
                <Button type="link" onClick={() => setConfigVisible(old => !old)}>
                    配置
                </Button>
                区域{idx + 1}
            </>
        }]} />
        {configVisible && <Flex vertical>
            <Space align='baseline'>
                <Form.Item {...restField} name={[idx, "x"]} >
                    <InputNumber className="nodrag nopan" step={1} min={0} max={maxWidth} prefix="X:" />
                </Form.Item>
                <Form.Item {...restField} name={[idx, "y"]}>
                    <InputNumber className="nodrag nopan" step={1} min={0} max={maxHeight} prefix="Y:" />
                </Form.Item>
            </Space>
            <Space align='baseline'>
                <Form.Item {...restField} name={[idx, "width"]} >
                    <InputNumber className="nodrag nopan" step={1} min={1} max={maxWidth} prefix="宽:" />
                </Form.Item>
                <Form.Item {...restField} name={[idx, "height"]}>
                    <InputNumber className="nodrag nopan" step={1} min={1} max={maxHeight} prefix="高:" />
                </Form.Item>
            </Space>
        </Flex>}
    </>;
}
export function FrameCrop({ id, selected, data }: NodeProps<Node<any, 'frame-crop'>>) {
    const setRuntimeNodeData_ = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
    const setRuntimeNodeData = useCallback(setRuntimeNodeData_, [setRuntimeNodeData_]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const updateNodeInternals = useUpdateNodeInternals();
    const tf = useTfjs();
    const [inputTensorShape, setInputTensorShape] = useState<number[]>();
    const setThrottledInputTensorShape = useThrottleFn(setInputTensorShape, { wait: 15 * 1000 });
    useEffect(() => {
        if (tf && data?.isPreview) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), (tensor) => {
                if (tensor) {
                    setThrottledInputTensorShape.run(tensor.shape);
                    if (canvasRef?.current) {
                        const canvas = canvasRef.current as HTMLCanvasElement;
                        toPixels(tensor, canvas).then(() => {
                            if (data?.crops) {
                                const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
                                for (let { x, y, width, height } of data?.crops) {
                                    ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
                                    ctx.lineWidth = 3;
                                    ctx.strokeRect(x, y, width, height);
                                }
                            }
                        });
                    }
                }
            }, { equalityFn: isEqual });
        }
    }, [tf, data, canvasRef]);
    useEffect(() => {
        if (tf && data?.crops) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), (tensor) => {
                if (tensor) {
                    data?.crops.forEach(({ x, y, width, height }: any, idx: number) => {
                        const start = [y, x, 0];
                        const size = [height, width, -1];
                        const croppedTensor = tf.slice(tensor, start, size);
                        setRuntimeNodeData({ [`param${idx}`]: croppedTensor });
                    });
                }
            }, { equalityFn: isEqual });
        }
    }, [tf, data?.corps]);
    return <ResizableNode id={id} data={data} selected={selected}>
        {(width, height) => <>
            <UseHandle input={[{ id: "tensor", label: "视频流" }]} />
            <Flex align='start'>
                <label>高x宽：</label>{inputTensorShape?.[0]}x{inputTensorShape?.[1]}
            </Flex>
            <Form
                initialValues={data}
                autoComplete="off"
                onValuesChange={(changedValues, values) => {
                    Object.assign(data, values);
                    updateNodeInternals(id);
                }}
            >
                <Form.Item label="预览" name="isPreview">
                    <Switch />
                </Form.Item>
                <Form.List name={"crops"}>
                    {(fields, { add, remove }) => (<>
                        {fields.map(({ key, name, ...restField }) => {
                            return <Crop
                                key={key} idx={name} restField={restField}
                                remove={() => remove(name)}
                                maxWidth={inputTensorShape?.[1]}
                                maxHeight={inputTensorShape?.[0]}
                            />
                        })}
                        <Form.Item>
                            <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                x: 0, y: 0, width: inputTensorShape?.[1], height: inputTensorShape?.[0]
                            })} >添加一项</Button>
                        </Form.Item>
                    </>)}
                </Form.List>
            </Form>
            {data?.isPreview && <canvas ref={canvasRef} style={{ width, height: "auto" }} ></canvas>}
        </>}
    </ResizableNode>;
}