import { NodeProps, NodeResizer, useUpdateNodeInternals } from '@xyflow/react';
import { type PoseValidator } from './types';
import { useRuntimeNodeStore } from '../App';
import UseHandle from '../components/UseHandle';
import { useEffect, useState } from 'react';
import { Upload, Image as AntdImage, Form, Slider, Select, Popover, Space, Button, Flex, InputNumber, message } from 'antd';
import { LineChartOutlined, MinusCircleOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined } from '@ant-design/icons';
import { drawKeypoints, drawSkeleton } from './PoseDetection';
import EditableTitle from '../components/EditableTitle';
import type { DefaultOptionType } from 'antd/es/select';

import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs-core';
import * as posedetection from '@tensorflow-models/pose-detection';
import { useThrottleFn } from 'ahooks';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

tfjsWasm.setWasmPaths('node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/');

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
        "value": 'leftEyeAngle',
        "label": '左眼角',
        "angleCompose": [2, 3, 7]
    },
    {
        "value": 'rightEyeAngle',
        "label": '右眼角',
        "angleCompose": [5, 6, 8]
    },
    {
        "value": 'facialMidlineAngle',
        "label": '面中角',
        "angleCompose": [1, 0, 4]
    },
    {
        "value": 'mouthNoseAngle',
        "label": '口鼻角',
        "angleCompose": [9, 0, 10]
    },
    {
        "value": "headShoulderAngle",
        "label": "头肩角",
        "angleCompose": [11, 0, 12]
    },
    {
        "value": "leftShoulderAngle",
        "label": "左肩角",
        "angleCompose": [13, 11, 23]
    },
    {
        "value": "rightShoulderAngle",
        "label": "右肩角",
        "angleCompose": [14, 12, 24]
    },
    {
        "value": "leftElbowAngle",
        "label": "左肘角",
        "angleCompose": [11, 13, 15]
    },
    {
        "value": "rightElbowAngle",
        "label": "右肘角",
        "angleCompose": [12, 14, 16]
    },
    {
        "value": "leftWristAngle",
        "label": "左手腕角",
        "angleCompose": [13, 15, 17]
    },
    {
        "value": "rightWristAngle",
        "label": "右手腕角",
        "angleCompose": [14, 16, 18]
    },
    {
        "value": "leftThumbAngle",
        "label": "左拇指角",
        "angleCompose": [21, 15, 17]
    },
    {
        "value": "rightThumbAngle",
        "label": "右拇指角",
        "angleCompose": [22, 16, 18]
    },
    {
        "value": "leftIndexAngle",
        "label": "左食指角",
        "angleCompose": [19, 15, 17]
    },
    {
        "value": "rightIndexAngle",
        "label": "右食指角",
        "angleCompose": [20, 16, 18]
    },
    {
        "value": "leftHipAngle",
        "label": "左髋角",
        "angleCompose": [11, 23, 25]
    },
    {
        "value": "rightHipAngle",
        "label": "右髋角",
        "angleCompose": [12, 24, 26]
    },
    {
        "value": "leftPelvisAngle",
        "label": "左骨盆角",
        "angleCompose": [24, 23, 25]
    },
    {
        "value": "rightPelvisAngle",
        "label": "右骨盆角",
        "angleCompose": [23, 24, 26]
    },
    {
        "value": "leftKneeAngle",
        "label": "左膝角",
        "angleCompose": [23, 25, 27]
    },
    {
        "value": "rightKneeAngle",
        "label": "右膝角",
        "angleCompose": [24, 26, 28]
    },
    {
        "value": "leftAnkleAngle",
        "label": "左踝角",
        "angleCompose": [25, 27, 29]
    },
    {
        "value": "rightAnkleAngle",
        "label": "右踝角",
        "angleCompose": [26, 28, 30]
    },
    {
        "value": "leftHeelAngle",
        "label": "左足跟角",
        "angleCompose": [27, 29, 31]
    },
    {
        "value": "rightHeelAngle",
        "label": "右足跟角",
        "angleCompose": [28, 30, 32]
    }
];
function genPoseJoints({ keypoints }: any, poseThreshold: number) {
    return jointOptions?.filter((option) => {
        const angleCompose = option.angleCompose;
        return angleCompose.every((index) => poseThreshold < ((keypoints[index] as any).score));
    }).map((option) => {
        const angleCompose = option.angleCompose;
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
                        let validatePoses = await detector.estimatePoses(img);
                        if (validatePoses) {
                            for (let pose of validatePoses) {
                                if (pose.keypoints != null) {
                                    drawKeypoints(ctx, pose.keypoints, { lineWidth: 8 });
                                    drawSkeleton(ctx, pose.keypoints, { lineWidth: 3, color: '#ffffff' });
                                    onSuccess && onSuccess({ validatePose: pose, url: canvas.toDataURL() });
                                    break;
                                }
                            }
                        }
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
function JointSelect({ onChange, value, nodeId }: any) {
    const [open, setOpen] = useState(false);
    const pose = useRuntimeNodeStore((state) => state.get(nodeId, "pose"));
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
            const angleCompose = jointOptions.find(({ value }: any) => value === option.value)?.angleCompose as number[];
            let realtimeJointAngle = 0;
            if (angleCompose && pose?.keypoints) {
                const keypoints = pose.keypoints;
                realtimeJointAngle = calculate3DAngle(keypoints[angleCompose[0]], keypoints[angleCompose[1]], keypoints[angleCompose[2]]);
            }
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
                        <div style={{ color: 'green', fontSize: 7, lineHeight: '8px' }}>{realtimeJointAngle && realtimeJointAngle.toFixed(1)}°</div>
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
    const dotProduct = A.map((a, i) => a * B[i] * weights[i]).reduce((sum, val) => sum + val, 0);
    const normA = Math.sqrt(A.map((a, i) => a * a * weights[i]).reduce((sum, val) => sum + val, 0));
    const normB = Math.sqrt(B.map((b, i) => b * b * weights[i]).reduce((sum, val) => sum + val, 0));
    return mapToZeroOne(dotProduct / (normA * normB));
}
function weightedJaccardSimilarity(A: number[], B: number[], weights: number[]) {
    const intersection = A.map((a, i) => Math.min(a, B[i]) * weights[i]).reduce((sum, val) => sum + val, 0);
    const union = A.map((a, i) => Math.max(a, B[i]) * weights[i]).reduce((sum, val) => sum + val, 0);
    return intersection / union;
}
function weightedMean(arr: number[], weights: number[]) {
    const sumWeightedValues = arr.reduce((sum, val, i) => sum + val * weights[i], 0);
    return sumWeightedValues / weights.reduce((sum, val) => sum + val, 0);
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
        weightedCovariance += weights[i] * deltaX * deltaY;
        weightedVarianceX += weights[i] * deltaX * deltaX;
        weightedVarianceY += weights[i] * deltaY * deltaY;
    }
    return mapToZeroOne(weightedCovariance / Math.sqrt(weightedVarianceX * weightedVarianceY));
}
function weightedManhattanSimilarity(A: number[], B: number[], weights: number[]) {
    const weightedDistance = A.map((a, i) => weights[i] * Math.abs(a - B[i])).reduce((sum, val) => sum + val, 0);
    return 1 - weightedDistance / (B.map(b => Math.max(b, 180 - b)).reduce((sum, val) => sum + val, 0));
}
const algorithmFuns: any = {
    "cosine": weightedCosineSimilarity,
    "jaccard": weightedJaccardSimilarity,
    "pearson": weightedPearsonSimilarity,
    "manhattan": weightedManhattanSimilarity
}
const scalingFunctionAlgorithmOptions = [
    {
        value: 'linear', label: <Space>
            线性函数
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                $f(x) = ax + b$
            </Markdown>
        </Space>,
        a: 100,
        b: 0
    },
    {
        value: 'exponential', label: <Space>
            指数函数
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
                                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
                                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
                                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
    const pose = useRuntimeNodeStore((state) => state.get(nodeId, "pose"));
    const setRuntimeNodeData = useRuntimeNodeStore((state) => (nodeData: any) => state.set(nodeId, nodeData));
    const setOutputScore = useThrottleFn((score) => {
        setRuntimeNodeData({ score })
    }, { wait: 500 });
    if (pose?.keypoints && scoreAlgorithm?.algorithm && scoreAlgorithm?.weights) {
        const keypoints: posedetection.Keypoint[] = pose.keypoints;
        const algorithmFun = algorithmFuns[scoreAlgorithm.algorithm] || weightedCosineSimilarity;
        const weights = scoreAlgorithm.weights;
        let A: number[] = [], B: number[] = [], weightsValue: number[] = [];
        weights.forEach(({ angleCompose: [p1, p2, p3], angle, value: weight }: any) => {
            const realtimeAngle = calculate3DAngle(keypoints[p1], keypoints[p2], keypoints[p3]);
            A.push(realtimeAngle);
            B.push(angle);
            weightsValue.push(weight);
        });
        let score = algorithmFun(A, B, normalizeWeights(weightsValue));
        const fn = scoreAlgorithm.scalingFunction.find(({ range: [min, max] }: any) => score >= min && score < max);
        if (fn) {
            const { algorithm, a, b, c } = fn;
            switch (algorithm) {
                case "exponential":
                    score = a * Math.pow(b, score) + c;
                    break;
                case "logarithmic":
                    score = a * Math.log(score) / Math.log(b) + c;
                    break;
                case "sigmoid":
                    score = a / (1 + Math.exp(-b * score)) + c;
                    break;
                case "linear":
                default:
                    score = a * score + b;
            }
        }
        setOutputScore.run(score);
        return score.toFixed(1);
    }
    return <></>;
}

export function PoseValidator({ id, selected, data }: NodeProps<PoseValidator>) {
    const [detector, setDetector] = useState<posedetection.PoseDetector | null>(null);
    const [form] = Form.useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
        async function init() {
            await tf.ready();
            setDetector(await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
                runtime: 'mediapipe',
                modelType: 'full',
                solutionPath: 'node_modules/@mediapipe/pose'
            }));
        }
        if (!detector) {
            init();
        }
        return () => {
            if (detector) {
                detector.dispose();
            }
        }
    }, [detector]);
    return <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
        <NodeResizer maxHeight={538} isVisible={selected || false} />
        <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
        <UseHandle input={[{ id: "pose", label: "姿态数据" }]} output={[{ id: "score", label: "得分" }]} />
        {detector && <Form size="small" colon form={form} style={{ maxHeight: '500px', overflowY: 'auto' }}
            initialValues={data} className='nowheel'
            onValuesChange={(changedValues, values) => {
                Object.assign(data, values);
                let poseJoints = changedValues?.poseJoints;
                if (changedValues?.poseThreshold || changedValues?.validatePoseImage) {
                    if (values?.validatePoseImage?.validatePose && values.poseThreshold) {
                        poseJoints = genPoseJoints(values.validatePoseImage.validatePose, values.poseThreshold);
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
            <Form.Item label="上传姿势" name="validatePoseImage" style={{ width: 230 }}>
                <UploadPose detector={detector}></UploadPose>
            </Form.Item>
            <Form.Item label="捕获阈值" name="poseThreshold">
                <Slider min={0} max={1} step={0.01} className="nodrag nopan" marks={{ 0.35: 0.35, 0.75: 0.75, 0.95: 0.95 }} />
            </Form.Item>
            <Form.Item label="捕获关节" name="poseJoints">
                <JointSelect nodeId={id} />
            </Form.Item>
            <Form.Item label={<span>
                得分
                <sup style={{ color: 'red' }}><Score nodeId={id} scoreAlgorithm={form.getFieldValue("scoreAlgorithm")}></Score></sup>
            </span>} name="scoreAlgorithm">
                <ScoreAlgorithmSelect />
            </Form.Item>
        </Form >}
    </div >;
}