import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { type PoseValidator } from './types';
import { useRuntimeNodeStore } from '../App';
import { useEffect, useRef, useState } from 'react';
import { Upload, Image as AntdImage, Form, Slider, Select, Popover, Space, Button, Flex, InputNumber, message } from 'antd';
import { LineChartOutlined, MinusCircleOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined } from '@ant-design/icons';
import { drawKeypoints, useHandPoseDetector } from '../components/HandPoseDetector';
import type { DefaultOptionType } from 'antd/es/select';
import Markdown from '../components/Markdown';

import * as posedetection from '@tensorflow-models/pose-detection';
import ResizableNode from '../components/ResizableNode';
import { useDeepCompareEffect } from 'ahooks';
import UseHandle from '../components/UseHandle';
import { Hand, Keypoint } from '@tensorflow-models/hand-pose-detection';


function calculate3DAngle(a: posedetection.Keypoint, b: posedetection.Keypoint, c: posedetection.Keypoint): number {
    const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z || 0 - (b.z || 0) };
    const bc = { x: b.x - c.x, y: b.y - c.y, z: b.z || 0 - (c.z || 0) };
    const dotProduct = ab.x * bc.x + ab.y * bc.y + ab.z * bc.z;
    const magnitudeAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y + ab.z * ab.z);
    const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);
    const angleInRadians = Math.acos(dotProduct / (magnitudeAB * magnitudeBC));
    return angleInRadians * (180 / Math.PI);
}
const jointOptions: (DefaultOptionType & { angleCompose: number[] })[] = [
    {
        "value": "leftThumbBaseAngle",
        "label": "左拇指根部角",
        "angleCompose": [1, 2, 3]
    },
    {
        "value": "leftThumbTipAngle",
        "label": "左拇指尖部角",
        "angleCompose": [2, 3, 4]
    },
    {
        "value": "leftIndexBaseAngle",
        "label": "左食指根部角",
        "angleCompose": [5, 6, 7]
    },
    {
        "value": "leftIndexTipAngle",
        "label": "左食指尖部角",
        "angleCompose": [6, 7, 8]
    },
    {
        "value": "leftMiddleBaseAngle",
        "label": "左中指根部角",
        "angleCompose": [9, 10, 11]
    },
    {
        "value": "leftMiddleTipAngle",
        "label": "左中指尖部角",
        "angleCompose": [10, 11, 12]
    },
    {
        "value": "leftRingBaseAngle",
        "label": "左无名指根部角",
        "angleCompose": [13, 14, 15]
    },
    {
        "value": "leftRingTipAngle",
        "label": "左无名指尖部角",
        "angleCompose": [14, 15, 16]
    },
    {
        "value": "leftPinkyBaseAngle",
        "label": "左小指根部角",
        "angleCompose": [17, 18, 19]
    },
    {
        "value": "leftPinkyTipAngle",
        "label": "左小指尖部角",
        "angleCompose": [18, 19, 20]
    },
    {
        "value": "rightThumbBaseAngle",
        "label": "右拇指根部角",
        "angleCompose": [1, 2, 3]
    },
    {
        "value": "rightThumbTipAngle",
        "label": "右拇指尖部角",
        "angleCompose": [2, 3, 4]
    },
    {
        "value": "rightIndexBaseAngle",
        "label": "右食指根部角",
        "angleCompose": [5, 6, 7]
    },
    {
        "value": "rightIndexTipAngle",
        "label": "右食指尖部角",
        "angleCompose": [6, 7, 8]
    },
    {
        "value": "rightMiddleBaseAngle",
        "label": "右中指根部角",
        "angleCompose": [9, 10, 11]
    },
    {
        "value": "rightMiddleTipAngle",
        "label": "右中指尖部角",
        "angleCompose": [10, 11, 12]
    },
    {
        "value": "rightRingBaseAngle",
        "label": "右无名指根部角",
        "angleCompose": [13, 14, 15]
    },
    {
        "value": "rightRingTipAngle",
        "label": "右无名指尖部角",
        "angleCompose": [14, 15, 16]
    },
    {
        "value": "rightPinkyBaseAngle",
        "label": "右小指根部角",
        "angleCompose": [17, 18, 19]
    },
    {
        "value": "rightPinkyTipAngle",
        "label": "右小指尖部角",
        "angleCompose": [18, 19, 20]
    }
];
function genPoseJoints(hands: Hand[]) {
    return jointOptions?.filter((option) => {
        const angleCompose = option.angleCompose;
        let keypoints: Keypoint[] | undefined;
        if ((option?.value as string).startsWith('right')) {
            keypoints = hands.find(({ handedness }) => handedness === 'Right')?.keypoints;
        } else {
            keypoints = hands.find(({ handedness }) => handedness === 'Left')?.keypoints;
        }
        if (keypoints && keypoints.length === 21) {
            option._keypoints = keypoints;
            return angleCompose.every((index) => keypoints[index]);
        } else {
            return false;
        }
    }).map((option) => {
        const angleCompose = option.angleCompose;
        let keypoints: Keypoint[] = option._keypoints;
        return {
            ...option,
            angle: calculate3DAngle(keypoints[angleCompose[0]], keypoints[angleCompose[1]], keypoints[angleCompose[2]])
        }
    });
}
function UploadPose({ onChange, value, detector }: any) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    return <>
        <Upload accept="image/*" listType='picture-card' maxCount={1} onChange={({ fileList }) => onChange(fileList[0]?.response)}
            customRequest={async ({ file, onSuccess }) => {
                const reader = new FileReader();
                reader.readAsDataURL(file as any);
                reader.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                    const img = new Image();
                    img.onload = async () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        let validateHands = await detector.estimateHands(img);
                        const hands = validateHands as Hand[];
                        hands.sort((hand1, hand2) => {
                            if (hand1.handedness < hand2.handedness) return 1;
                            if (hand1.handedness > hand2.handedness) return -1;
                            return 0;
                        });
                        while (hands.length < 2) hands.push({} as any);
                        for (let i = 0; i < hands.length; ++i) {
                            const hand = hands[i];
                            if (hand.keypoints && hand.handedness) {
                                drawKeypoints(ctx, hand.keypoints, hand.handedness, true, true, {
                                    keypointsLineWidth: 8,
                                    skeletonLineWidth: 3,
                                    skeletonColor: '#ffffff'
                                });
                            }
                        }
                        onSuccess && onSuccess({ validateHands, url: canvas.toDataURL() });
                    }
                    img.src = reader.result as string;
                }
            }}
            onPreview={async (file: any) => {
                setPreviewImage(file.url);
                setPreviewOpen(true);
            }}
            fileList={value && value.url && [value]}
        >
            {(!value || !value.url) && <><UploadOutlined></UploadOutlined>点击上传</>}
        </Upload>
        {
            previewImage && <AntdImage
                wrapperStyle={{ display: 'none' }}
                preview={{
                    visible: previewOpen,
                    onVisibleChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                }}
                src={previewImage}
            />
        }
    </>
}
function RealTimeAngle({ nodeId, option }: any) {
    const [realtimeJointAngleStr, setRealtimeJointAngleStr] = useState<string>();
    useEffect(() => {
        return useRuntimeNodeStore.subscribe((state) => state.get(nodeId, "hands"), (hands: Hand[]) => {
            const jointOption = jointOptions.find(({ value }: any) => value === option.value);
            const angleCompose = jointOption?.angleCompose as number[];
            let keypoints: Keypoint[] | undefined;
            if ((jointOption?.value as string).startsWith('right')) {
                keypoints = hands && hands.find(({ handedness }) => handedness === 'Right')?.keypoints;
            } else {
                keypoints = hands && hands.find(({ handedness }) => handedness === 'Left')?.keypoints;
            }
            let realtimeJointAngle = Infinity;
            if (keypoints && keypoints.length === 21 && angleCompose) {
                realtimeJointAngle = calculate3DAngle(keypoints[angleCompose[0]], keypoints[angleCompose[1]], keypoints[angleCompose[2]]);
            }
            setRealtimeJointAngleStr(realtimeJointAngle === Infinity ? "不可信" : (realtimeJointAngle && realtimeJointAngle.toFixed(1)) + "°");
        });
    }, []);

    return realtimeJointAngleStr;
}
function JointSelect({ onChange, value, nodeId }: any) {
    const [open, setOpen] = useState(false);
    const hands = useRef<any>();
    useEffect(() => {
        return useRuntimeNodeStore.subscribe((state) => state.get(nodeId, "hands"), (hands_) => hands.current = hands_);
    }, []);
    return <Select size='small' style={{ maxWidth: 310 }} value={value} onChange={(v: string[]) => {
        onChange(v.map(key => {
            const item = value && value.find((item: any) => item.value === key);
            if (!item) {
                return {
                    ...jointOptions.find(({ value: v }) => v === key),
                    angle: 0
                }
            }
            return item;
        }));
    }}
        className="nodrag nopan" mode="multiple" optionFilterProp="label" options={jointOptions}
        open={open} onSelect={() => setOpen(false)}
        onDropdownVisibleChange={(visible) => setOpen(visible)}
        allowClear labelRender={(option: any) => {
            const jointAngle = value && value.find(({ value }: any) => value === option.value)?.angle || 0;
            return <Popover content={<div onMouseDown={(e) => e.stopPropagation()} style={{ width: 300 }}>
                <Form size='small' colon>
                    <Form.Item label="角度">
                        <Slider value={jointAngle} onChange={(v) => {
                            onChange(value.map((item: any) => {
                                if (option.value === item.value) {
                                    return { ...item, angle: v };
                                }
                                return item
                            }));
                        }} min={0} max={180} step={0.1} marks={{ 63.5: 63.5, 136.5: 136.5, 172.5: 172.5 }} >
                        </Slider>
                    </Form.Item>
                </Form>

            </div>}>
                <div style={{ display: "flex" }}>
                    {option.label}
                    <div style={{ width: '20px', display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{ color: 'green', fontSize: 7, lineHeight: '8px' }}><RealTimeAngle option={option} nodeId={nodeId} ></RealTimeAngle></div>
                        <div style={{ color: 'red', fontSize: 7, lineHeight: '7px' }}>{jointAngle && jointAngle.toFixed(1)}°</div>
                    </div>
                </div>
            </Popover>;
        }}
    >
    </Select>;
}
function mapToZeroOne(x: number) {
    return (x + 1) / 2;
}
function normalizeWeights(weights: number[]) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map(weight => weight / total);
}
function weightedCosineSimilarity(A: number[], B: number[], weights: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < A.length; i++) {
        dotProduct += A[i] * B[i] * weights[i];
        normA += A[i] * A[i] * weights[i];
        normB += B[i] * B[i] * weights[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return mapToZeroOne(dotProduct / denominator);
}
function weightedJaccardSimilarity(A: number[], B: number[], weights: number[]) {
    let intersection = 0;
    let union = 0;

    for (let i = 0; i < A.length; i++) {
        intersection += Math.min(A[i], B[i]) * weights[i];
        union += Math.max(A[i], B[i]) * weights[i];
    }

    return intersection / union;
}
function weightedMean(arr: number[], weights: number[]) {
    const totalWeight = weights.reduce((sum, val) => sum + val, 0);
    const sumWeightedValues = arr.reduce((sum, val, i) => sum + val * weights[i], 0);
    return sumWeightedValues / totalWeight;
}
function weightedPearsonSimilarity(A: number[], B: number[], weights: number[]) {
    const meanX = weightedMean(A, weights);
    const meanY = weightedMean(B, weights);

    let weightedCovariance = 0;
    let weightedVarianceX = 0;
    let weightedVarianceY = 0;

    for (let i = 0; i < A.length; i++) {
        const deltaX = A[i] - meanX;
        const deltaY = B[i] - meanY;
        const weightedProduct = weights[i] * deltaX * deltaY;

        weightedCovariance += weightedProduct;
        weightedVarianceX += weights[i] * deltaX * deltaX;
        weightedVarianceY += weights[i] * deltaY * deltaY;
    }

    return mapToZeroOne(weightedCovariance / Math.sqrt(weightedVarianceX * weightedVarianceY));
}
function weightedManhattanSimilarity(A: number[], B: number[], weights: number[]) {
    let weightedDistance = 0;
    let maxDistance = 0;

    for (let i = 0; i < A.length; i++) {
        const weight = weights[i];
        weightedDistance += weight * Math.abs(A[i] - B[i]);
        maxDistance += weight * Math.max(B[i], 180 - B[i]);
    }

    return 1 - weightedDistance / maxDistance;
}
const algorithmFuns: Record<string, (A: number[], B: number[], weights: number[]) => number> = {
    "cosine": weightedCosineSimilarity,
    "jaccard": weightedJaccardSimilarity,
    "pearson": weightedPearsonSimilarity,
    "manhattan": weightedManhattanSimilarity
}
const scalingFunctionAlgorithmOptions = [
    {
        value: 'linear', label: <Space>
            线性函数
            <Markdown>
                $f(x) = ax + b$
            </Markdown>
        </Space>,
        a: 100,
        b: 0
    },
    {
        value: 'exponential', label: <Space>
            指数函数
            <Markdown>
                $f(x) = ab^x + c$
            </Markdown>
        </Space>,
        a: 60,
        b: 1.5,
        c: 0
    },
    {
        value: 'logarithmic', label: <Space>
            对数函数
            <Markdown>
                {'$f(x) = a\log_{b}{x} + c$'}
            </Markdown>
        </Space>,
        a: 100,
        b: 0.01,
        c: 90
    },
    {
        value: 'sigmoid', label: <Space>
            Sigmoid函数
            <Markdown>
                {'$f(x) = \\frac{a}{1 + e^{-bx}} + c$'}
            </Markdown>
        </Space>,
        a: 100,
        b: 2,
        c: 0
    }
];
function findFirstAvailableRange(ranges: number[][]) {
    ranges.sort((a, b) => a[0] - b[0]);
    let currentMin = 0;
    for (const range of ranges) {
        const [min, max] = range;
        if (currentMin < min) {
            return [currentMin, min];
        }
        currentMin = Math.max(currentMin, max);
        if (currentMin >= 1) {
            return null;
        }
    }
    if (currentMin < 1) {
        return [currentMin, 1];
    }
    return null;
}
function ScoreAlgorithmSelect({ onChange, value }: any) {
    const [weightVisible, setWeightVisible] = useState(false);
    const [scalingFunctionVisible, setScalingFunctionVisible] = useState(false);

    return <>
        <Flex vertical gap={0}>
            <Space wrap>
                <Select style={{ minWidth: 145 }}
                    size='small' className='nodrag nopan'
                    value={value?.algorithm}
                    onChange={(v: string) => onChange({ ...value, algorithm: v })}
                    options={[
                        { label: '余弦相似度', value: 'cosine' },
                        { label: '杰卡德相似度', value: 'jaccard' },
                        { label: '皮尔逊相关系数', value: 'pearson' },
                        { label: '曼哈顿相似度', value: 'manhattan' }
                    ]}
                ></Select>
                <Button size='small' onClick={() => setWeightVisible(old => !old)} icon={<UnorderedListOutlined style={weightVisible && { color: '#91caff' } || {}} />}>
                    权重
                </Button>
                <Button size='small' onClick={() => setScalingFunctionVisible(old => !old)} icon={<LineChartOutlined style={scalingFunctionVisible && { color: '#91caff' } || {}} />}>
                    缩放函数
                </Button>
            </Space>
            {
                weightVisible && value.weights && <>
                    {value.weights.map((weight: any) => {
                        return <Form.Item key={weight.key} label={weight.label}>
                            <Slider className='nodrag nopan' value={weight.value} onChange={(v) => {
                                onChange({
                                    ...value, weights: value.weights.map((item: any) => {
                                        if (item.key === weight.key) {
                                            return { ...item, value: v };
                                        }
                                        return item;
                                    })
                                })
                            }} min={0.01} max={1} step={0.01} />
                        </Form.Item>
                    })}
                </>
            }
            {
                scalingFunctionVisible && <>
                    {value?.scalingFunction && <>
                        {value.scalingFunction.map((fn: any, index: number) => {
                            return <Space key={index} align='baseline'>
                                <Flex vertical>
                                    <Form.Item label="相似度区间">
                                        <Slider style={{ minWidth: '210px' }} className='nodrag nopan'
                                            range min={0} max={1} step={0.01} value={fn.range} marks={{ 0: 0, 0.35: 0.35, 0.75: 0.75, 1: 1 }}
                                            onChange={v => {
                                                const ranges = value.scalingFunction.filter((_: any, i: number) => i !== index).map(({ range }: any) => range);
                                                for (let [min, max] of ranges) {
                                                    if (min < v[0] && max > v[0]) {
                                                        return;
                                                    }
                                                    if (min < v[1] && max > v[1]) {
                                                        return;
                                                    }
                                                    if (min >= v[0] && max <= v[1]) {
                                                        return;
                                                    }
                                                    if (v[0] === v[1]) {
                                                        return;
                                                    }
                                                }
                                                onChange({
                                                    ...value, scalingFunction: value.scalingFunction.map((item: any, i: number) => {
                                                        if (index === i) {
                                                            return { ...item, range: v };
                                                        }
                                                        return item;
                                                    })
                                                });
                                            }}
                                        ></Slider>
                                    </Form.Item>
                                    <Form.Item label="函数">
                                        <Select className='nodrag nopan' options={scalingFunctionAlgorithmOptions} value={fn.algorithm}
                                            onChange={v => onChange({
                                                ...value, scalingFunction: value.scalingFunction.map((item: any, i: number) => {
                                                    if (index === i) {
                                                        let { a, b, c } = scalingFunctionAlgorithmOptions.find(({ value: algorithm }: any) => algorithm === v) as any;
                                                        return { ...item, algorithm: v, a, b, c };
                                                    }
                                                    return item;
                                                })
                                            })}></Select>
                                    </Form.Item>
                                    <Form.Item label={<Space>
                                        参数
                                        <Markdown>
                                            $a$
                                        </Markdown>
                                    </Space>}>
                                        <InputNumber className='nodrag nopan' min={0.01} value={fn?.a} step={0.1} onChange={v => onChange({
                                            ...value, scalingFunction: value.scalingFunction.map((item: any, i: number) => {
                                                if (index === i) {
                                                    return { ...item, a: v };
                                                }
                                                return item;
                                            })
                                        })}></InputNumber>
                                    </Form.Item>
                                    <Form.Item label={<Space>
                                        参数
                                        <Markdown>
                                            $b$
                                        </Markdown>
                                    </Space>}>
                                        <InputNumber className='nodrag nopan' min={fn.algorithm === 'linear' ? 0 : 0.01} value={fn?.b} step={0.1} onChange={v => onChange({
                                            ...value, scalingFunction: value.scalingFunction.map((item: any, i: number) => {
                                                if (index === i) {
                                                    return { ...item, b: v };
                                                }
                                                return item;
                                            })
                                        })}></InputNumber>
                                    </Form.Item>
                                    {fn.algorithm !== 'linear' && <Form.Item label={<Space>
                                        参数
                                        <Markdown>
                                            $c$
                                        </Markdown>
                                    </Space>}>
                                        <InputNumber className='nodrag nopan' min={0} value={fn?.c} step={0.1} onChange={v => onChange({
                                            ...value, scalingFunction: value.scalingFunction.map((item: any, i: number) => {
                                                if (index === i) {
                                                    return { ...item, c: v };
                                                }
                                                return item;
                                            })
                                        })}></InputNumber>
                                    </Form.Item>}
                                </Flex>
                                <MinusCircleOutlined style={{ color: value.scalingFunction.length > 1 && "#91caff" || '#e2e2e2' }} onClick={() => {
                                    if (value.scalingFunction.length > 1) {
                                        onChange({
                                            ...value, scalingFunction: value.scalingFunction.filter((item: any, i: number) => index !== i)
                                        });
                                    }
                                }} />
                            </Space>
                        })}
                        <Form.Item>
                            <Button type="dashed" onClick={() => {
                                const range = findFirstAvailableRange(value.scalingFunction.map(({ range }: any) => range));
                                if (range) {
                                    onChange({
                                        ...value, scalingFunction: [...value.scalingFunction, {
                                            range,
                                            algorithm: 'linear',
                                            a: 100,
                                            b: 0
                                        }]
                                    });
                                } else {
                                    message.warning("[0,1]区间已经被占用");
                                }
                            }} block icon={<PlusOutlined />}>
                                添加一项
                            </Button>
                        </Form.Item>
                    </>}
                </>
            }
        </Flex>
    </>
}
function Score({ nodeId, scoreAlgorithm }: any) {
    const score = useRef<number | null>(null);
    const setRuntimeNodeData = useRuntimeNodeStore((state) => (nodeData: any) => state.set(nodeId, nodeData));
    useDeepCompareEffect(() => {
        return useRuntimeNodeStore.subscribe(state => state.get(nodeId, "hands"), (hands: Hand[]) => {
            if (hands && scoreAlgorithm?.algorithm && scoreAlgorithm?.weights) {
                const algorithmFun = algorithmFuns[scoreAlgorithm.algorithm] || weightedCosineSimilarity;
                const weights = scoreAlgorithm.weights;
                let A: number[] = [], B: number[] = [], weightsValue: number[] = [];
                weights.forEach(({ key, angleCompose: [p1, p2, p3], angle, value: weight }: any) => {
                    let keypoints: Keypoint[] | undefined;
                    if ((key as string).startsWith('right')) {
                        keypoints = hands && hands.find(({ handedness }) => handedness === 'Right')?.keypoints;
                    } else {
                        keypoints = hands && hands.find(({ handedness }) => handedness === 'Left')?.keypoints;
                    }
                    if (keypoints) {
                        A.push(calculate3DAngle(keypoints[p1], keypoints[p2], keypoints[p3]));
                    } else {
                        A.push(Infinity);
                    }
                    B.push(angle);
                    weightsValue.push(weight);
                });
                let score_ = algorithmFun(A, B, normalizeWeights(weightsValue));
                const fn = scoreAlgorithm.scalingFunction.find(({ range: [min, max] }: any) => score_ >= min && score_ < max);
                if (fn) {
                    const { algorithm, a, b, c } = fn;
                    switch (algorithm) {
                        case "exponential":
                            score_ = a * Math.pow(b, score_) + c;
                            break;
                        case "logarithmic":
                            score_ = a * Math.log(score_) / Math.log(b) + c;
                            break;
                        case "sigmoid":
                            score_ = a / (1 + Math.exp(-b * score_)) + c;
                            break;
                        case "linear":
                        default:
                            score_ = a * score_ + b;
                    }
                }
                score.current = Math.max(0, score_);
                setRuntimeNodeData({ score: score_ });
            }
        });
    }, [scoreAlgorithm]);
    return score.current && score.current.toFixed(1);
}

export function HandPoseValidator({ id, selected, data }: NodeProps<PoseValidator>) {
    const [configVisible, setConfigVisible] = useState(false);
    const detector = useHandPoseDetector();
    const [form] = Form.useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    return <ResizableNode data={data} selected={selected}>
        {(width, height) => <>
            <UseHandle input={[{
                id: "hands", label: <span>
                    手势数据
                    <Button size="small" type="link" onClick={() => setConfigVisible(old => !old)}>
                        配置
                    </Button>
                </span>
            }]} output={[{
                id: "score", label: <span>
                    得分
                    <sup style={{ color: 'red' }}>
                        <Score nodeId={id} scoreAlgorithm={data.scoreAlgorithm}></Score>
                    </sup>
                </span>
            }]} />
            {configVisible && detector && <Form size="small" colon form={form}
                style={{
                    maxHeight: '500px', overflowY: 'auto'
                }}
                initialValues={data} className='nowheel'
                onValuesChange={(changedValues, values) => {
                    Object.assign(data, values);
                    let poseJoints = changedValues?.poseJoints;
                    if (changedValues?.poseCaptureThreshold || changedValues?.validateHandPoseImage) {
                        if (values?.validateHandPoseImage?.validateHands) {
                            poseJoints = genPoseJoints(values.validateHandPoseImage.validateHands);
                        }
                    }
                    if (poseJoints) {
                        Object.assign(data, {
                            poseJoints,
                            scoreAlgorithm: {
                                ...values?.scoreAlgorithm,
                                weights: poseJoints?.map((joint: any) => {
                                    if (values?.scoreAlgorithm?.weights) {
                                        const weight = values.scoreAlgorithm.weights.find(({ key }: any) => key === joint.value);
                                        if (weight) {
                                            return { ...weight, angle: joint.angle };
                                        }
                                    }
                                    return {
                                        key: joint.value,
                                        label: joint.label,
                                        angleCompose: joint.angleCompose,
                                        angle: joint.angle,
                                        value: 0.01
                                    };

                                })
                            }
                        });
                    }
                    form.setFieldsValue(data);
                    updateNodeInternals(id);
                }}
            >
                <Form.Item label="上传手势" name="validateHandPoseImage" style={{ width: 230 }}>
                    <UploadPose detector={detector}></UploadPose>
                </Form.Item>
                <Form.Item label="捕获关节" name="poseJoints">
                    <JointSelect nodeId={id} />
                </Form.Item>
                <Form.Item label="得分" name="scoreAlgorithm">
                    <ScoreAlgorithmSelect />
                </Form.Item>
            </Form>}
        </>}
    </ResizableNode>;
}