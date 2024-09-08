import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { toPixels, useTfjs } from '../components/Tfjs';
import ResizableNode from '../components/ResizableNode';
import { Button, ColorPicker, Flex, Form, Select, Space, Switch } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { FullscreenOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { drawKeypoints, drawSkeleton } from '../components/PoseDetector';
import { drawKeypoints as drawHandKeypoints } from '../components/HandPoseDetector';
import { useDeepCompareEffect } from 'ahooks';
import { customThrottle } from '../components/Utils';
import { Hand } from '@tensorflow-models/hand-pose-detection';

export const poseJoint = [
    { "value": 0, "label": "鼻子" },
    { "value": 1, "label": "左眼内" },
    { "value": 2, "label": "左眼" },
    { "value": 3, "label": "左眼外" },
    { "value": 4, "label": "右眼内" },
    { "value": 5, "label": "右眼" },
    { "value": 6, "label": "右眼外" },
    { "value": 7, "label": "左耳" },
    { "value": 8, "label": "右耳" },
    { "value": 9, "label": "左嘴角" },
    { "value": 10, "label": "右嘴角" },
    { "value": 11, "label": "左肩" },
    { "value": 12, "label": "右肩" },
    { "value": 13, "label": "左肘" },
    { "value": 14, "label": "右肘" },
    { "value": 15, "label": "左手腕" },
    { "value": 16, "label": "右手腕" },
    { "value": 17, "label": "左小指" },
    { "value": 18, "label": "右小指" },
    { "value": 19, "label": "左食指" },
    { "value": 20, "label": "右食指" },
    { "value": 21, "label": "左拇指" },
    { "value": 22, "label": "右拇指" },
    { "value": 23, "label": "左臀" },
    { "value": 24, "label": "右臀" },
    { "value": 25, "label": "左膝" },
    { "value": 26, "label": "右膝" },
    { "value": 27, "label": "左脚踝" },
    { "value": 28, "label": "右脚踝" },
    { "value": 29, "label": "左脚跟" },
    { "value": 30, "label": "右脚跟" },
    { "value": 31, "label": "左脚尖" },
    { "value": 32, "label": "右脚尖" }
];
function toggleCanvasFullScreen(canvas: HTMLCanvasElement) {
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if ((canvas as any).webkitRequestFullScreen) {
        // Safari 支持
        (canvas as any).webkitRequestFullScreen();
    } else if ((canvas as any).mozRequestFullScreen) {
        // Firefox 支持
        (canvas as any).mozRequestFullScreen();
    } else if ((canvas as any).msRequestFullscreen) {
        // IE/Edge 支持
        (canvas as any).msRequestFullscreen();
    }
}
function drawTextWithPosition(ctx: CanvasRenderingContext2D, text: string, position: string, fontSize: number = 20, color: string = '#ffffff') {
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    let x, y, textAlign, textBaseline;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    switch (position) {
        case 'lt':
            x = 0;
            y = 0;
            textAlign = 'left';
            textBaseline = 'top';
            break;
        case 'lb':
            x = 0;
            y = ctx.canvas.height;
            textAlign = 'left';
            textBaseline = 'bottom';
            break;
        case 'rt':
            x = ctx.canvas.width;
            y = 0;
            textAlign = 'right';
            textBaseline = 'top';
            break;
        case 'rb':
        default:
            x = ctx.canvas.width;
            y = ctx.canvas.height;
            textAlign = 'right';
            textBaseline = 'bottom';
            break;
    }
    ctx.textAlign = textAlign as CanvasTextAlign;
    ctx.textBaseline = textBaseline as CanvasTextBaseline;
    lines.forEach((line, index) => {
        let offsetY = index * lineHeight;
        if (textBaseline === 'bottom') offsetY = -(lines.length - index) * lineHeight;
        ctx.fillText(line, x, y + offsetY);
    });
}

function DrawAction({ obj, canvas, nodeId, idx, restField, remove }: any) {
    const [configVisible, setConfigVisible] = useState(false);
    const throttledText = customThrottle(
        useCallback((text: string, state: string) => text, [idx]),
        200,
        (text: string, state: string) => state === '校验',
        1000
    );
    useDeepCompareEffect(() => {
        return useRuntimeNodeStore.subscribe(state => state.get(nodeId, `param${idx}`), param => {
            if (param) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    switch (obj?.type) {
                        case "pose":
                            const keypoints = param?.keypoints;
                            if (keypoints) {
                                if (obj.drawKeypoints) {
                                    drawKeypoints(ctx, keypoints, { excludeKeypoints: obj?.excludeKeypoints });
                                }
                                if (obj.drawSkeleton) {
                                    drawSkeleton(ctx, keypoints, { excludeKeypoints: obj?.excludeKeypoints });
                                }
                            }
                            break;
                        case "hands":
                            const hands = param as Hand[];
                            hands.sort((hand1, hand2) => {
                                if (hand1.handedness < hand2.handedness) return 1;
                                if (hand1.handedness > hand2.handedness) return -1;
                                return 0;
                            });
                            while (hands.length < 2) hands.push({} as any);
                            for (let i = 0; i < hands.length; ++i) {
                                const hand = hands[i];
                                if (hand.keypoints && hand.handedness) {
                                    drawHandKeypoints(ctx, hand.keypoints, hand.handedness, obj.drawKeypoints, obj.drawSkeleton);
                                }
                            }
                            break;
                        case "scoreInfoFrame":
                            let text = '';
                            if (obj.drawName && param.name) {
                                text += param.name;
                            }
                            if (obj.drawState && param.state) {
                                text += '(' + param.state + ')';
                            }
                            if (obj.drawScore && param.formatScore) {
                                text += ': ' + param.formatScore;
                            }
                            if (obj.drawRemainTime && param.remainTime !== undefined) {
                                text += ' ' + param.remainTime.toFixed(0);
                            }
                            drawTextWithPosition(ctx, throttledText(text, param.state), obj.drawPosition, obj.drawFontSize, obj.drawFontColor);
                            break;
                    }
                }
            }
        }, { equalityFn: isEqual });
    }, [obj]);
    return <Flex vertical>
        <Space align='baseline'>
            <UseHandle input={[{
                id: `param${idx}`, label: <>
                    参数{idx + 1}
                    <Button  type="link" onClick={() => setConfigVisible(old => !old)}>
                        配置
                    </Button>
                </>
            }]} />
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "type"]}>
                <Select style={{ minWidth: 90 }}  options={[
                    { label: "姿态数据", value: "pose" },
                    { label: "手势数据", value: "hands" },
                    { label: "得分信息帧", value: "scoreInfoFrame" }
                ]} />
            </Form.Item>
            <MinusCircleOutlined onClick={remove} />
        </Space>
        {(function () {
            if (configVisible) {
                switch (obj?.type) {
                    case "pose":
                        return <>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawKeypoints"]} label="绘制关节">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "excludeKeypoints"]} label="排除关节">
                                <Select  optionFilterProp="label" allowClear mode='multiple' options={poseJoint}></Select>
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawSkeleton"]} label="绘制骨骼">
                                <Switch />
                            </Form.Item>
                        </>;
                    case "hands":
                        return <>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawKeypoints"]} label="绘制关节">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawSkeleton"]} label="绘制骨骼">
                                <Switch />
                            </Form.Item>
                        </>;
                    case "scoreInfoFrame":
                        return <>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawName"]} label="绘制名称">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawState"]} label="绘制状态">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawScore"]} label="绘制得分">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawRemainTime"]} label="绘制倒计时">
                                <Switch />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawFontSize"]} label="字体大小">
                                <Select  options={[
                                    { label: "大", value: "28" },
                                    { label: "中", value: "20" },
                                    { label: "小", value: "11" },
                                    { label: "超小", value: "9" }
                                ]} />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" getValueFromEvent={(color, hex) => hex} name={[idx, "drawFontColor"]} label="字体颜色">
                                <ColorPicker />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "drawPosition"]} label="绘制区域">
                                <Select  options={[
                                    { label: "左上", value: "lt" },
                                    { label: "左下", value: "lb" },
                                    { label: "右上", value: "rt" },
                                    { label: "右下", value: "rb" }
                                ]} />
                            </Form.Item>
                        </>;
                    default:
                        return;
                }
            }
        })()}
    </Flex>;
}
function hexToRgba(hex: string) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 255]; // 最后的 255 是 alpha 通道，代表不透明
}

export function VideoRender({ id, selected, data }: NodeProps<Node<any, 'video-render'>>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tf = useTfjs();
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
        if (tf && canvasRef?.current) {
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), (tensor) => {
                if (tensor) {
                    const canvas = canvasRef.current as HTMLCanvasElement;
                    if (data?.noVideo) {
                        const shape = tensor.shape;
                        const rgba = hexToRgba("#3C4F5B");
                        const colorTensor = tf.tensor(new Array(shape[0] * shape[1] * 4).fill(0).map((_, index) => rgba[index % 4]), shape, 'int32') as any;
                        toPixels(colorTensor, canvas).then(() => colorTensor.dispose());
                    } else{
                        toPixels(tensor, canvas);
                    }
                }
            }, { equalityFn: isEqual });
        }
    }, [tf, canvasRef?.current, data?.noVideo]);
    return (
        <ResizableNode id={id} minWidth={220} data={data} selected={selected}>
            {(width) => <>
                <UseHandle input={[{
                    id: "tensor", label: <span>
                        视频流&nbsp;
                        <Button type='dashed'  onClick={() => canvasRef.current && toggleCanvasFullScreen(canvasRef.current)} icon={<FullscreenOutlined />} >全屏</Button>
                    </span>
                }]}></UseHandle>
                <Form  className='nowheel' colon
                    style={{ width }}
                    form={form} initialValues={data}
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.Item label="隐私" name="noVideo">
                        <Switch />
                    </Form.Item>
                    {canvasRef?.current && <Form.List name={"drawActions"}>
                        {(fields, { add, remove }) => (<>
                            {fields.map(({ key, name, ...restField }) => {
                                return <DrawAction obj={form.getFieldValue("drawActions")?.[name]} canvas={canvasRef?.current} nodeId={id} key={key} idx={name} restField={restField} remove={() => remove(name)} />
                            })}
                            <Form.Item>
                                <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                    type: 'pose',
                                    drawKeypoints: true,
                                    drawSkeleton: true,
                                    drawName: true,
                                    drawScore: true,
                                    drawState: true,
                                    drawRemainTime: true,
                                    drawPosition: "rt",
                                    drawFontColor: "#ffffff",
                                    drawFontSize: 20
                                })} >
                                    添加一项
                                </Button>
                            </Form.Item>
                        </>)}
                    </Form.List>}
                </Form>
                <canvas ref={canvasRef} style={{ width, height: "auto" }} ></canvas>
            </>}
        </ResizableNode>
    );
}
