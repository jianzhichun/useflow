import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { useCallback, useEffect } from 'react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import { isEqual } from 'lodash';
import ResizableNode from '../components/ResizableNode';
import { Button, Flex, Form, Select, Space, Switch } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useCocoSsd } from '../components/ObjectDetector';
import { useTfjs } from '../components/Tfjs';
import type { Node } from '@xyflow/react';
import SortTracker, { Detection } from '../components/SortTracker';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import * as tf from '@tensorflow/tfjs-core';

export const classZh: { [key: string]: string } = {
    "person": "人",
    "bicycle": "自行车",
    "car": "汽车",
    "motorcycle": "摩托车",
    "airplane": "飞机",
    "bus": "公共汽车",
    "train": "火车",
    "truck": "卡车",
    "boat": "船",
    "traffic light": "交通信号灯",
    "fire hydrant": "消防栓",
    "stop sign": "停车标志",
    "parking meter": "停车计时器",
    "bench": "长椅",
    "bird": "鸟",
    "cat": "猫",
    "dog": "狗",
    "horse": "马",
    "sheep": "绵羊",
    "cow": "牛",
    "elephant": "大象",
    "bear": "熊",
    "zebra": "斑马",
    "giraffe": "长颈鹿",
    "backpack": "背包",
    "umbrella": "雨伞",
    "handbag": "手提包",
    "tie": "领带",
    "suitcase": "行李箱",
    "frisbee": "飞盘",
    "skis": "滑雪板",
    "snowboard": "单板滑雪板",
    "sports ball": "运动球",
    "kite": "风筝",
    "baseball bat": "棒球棒",
    "baseball glove": "棒球手套",
    "skateboard": "滑板",
    "surfboard": "冲浪板",
    "tennis racket": "网球拍",
    "bottle": "瓶子",
    "wine glass": "酒杯",
    "cup": "杯子",
    "fork": "叉子",
    "knife": "刀",
    "spoon": "勺子",
    "bowl": "碗",
    "banana": "香蕉",
    "apple": "苹果",
    "sandwich": "三明治",
    "orange": "橙子",
    "broccoli": "西兰花",
    "carrot": "胡萝卜",
    "hot dog": "热狗",
    "pizza": "披萨",
    "donut": "甜甜圈",
    "cake": "蛋糕",
    "chair": "椅子",
    "couch": "沙发",
    "potted plant": "盆栽植物",
    "bed": "床",
    "dining table": "餐桌",
    "toilet": "马桶",
    "TV": "电视",
    "laptop": "笔记本电脑",
    "mouse": "鼠标",
    "remote": "遥控器",
    "keyboard": "键盘",
    "cell phone": "手机",
    "microwave": "微波炉",
    "oven": "烤箱",
    "toaster": "烤面包机",
    "sink": "水槽",
    "refrigerator": "冰箱",
    "book": "书",
    "clock": "时钟",
    "vase": "花瓶",
    "scissors": "剪刀",
    "teddy bear": "泰迪熊",
    "hair drier": "吹风机",
    "toothbrush": "牙刷"
};


function blurOutsideBBox(tensor: tf.Tensor4D, bbox: [number, number, number, number]) {
    const [x, y, width, height] = bbox;

    return tf.tidy(() => {
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const cropWidth = Math.floor(width);
        const cropHeight = Math.floor(height);

        const [imageHeight, imageWidth, channels] = tensor.shape;

        // 创建遮罩
        const innerMask = tf.ones([cropHeight, cropWidth, 1]);
        const mask = tf.pad(
            innerMask,
            [[startY, imageHeight - startY - cropHeight], [startX, imageWidth - startX - cropWidth], [0, 0]]
        );
        innerMask.dispose();

        // 模糊处理
        const smallBlurred = tf.image.resizeBilinear(tensor, [imageHeight / 10, imageWidth / 10]);
        const blurredImage = tf.image.resizeBilinear(smallBlurred, [imageHeight, imageWidth]);
        smallBlurred.dispose();

        // 应用遮罩
        const mask3d = tf.tile(mask, [1, 1, channels]);
        const invertedMask = tf.sub(tf.scalar(1), mask3d);
        const output = tf.add(
            tf.mul(tensor, mask3d),
            tf.mul(blurredImage, invertedMask)
        );

        mask.dispose();
        mask3d.dispose();
        invertedMask.dispose();
        blurredImage.dispose();

        return tf.cast(output, 'int32');
    });
}
function cropAndNormalizeTensor(tensor: tf.Tensor4D, bbox: [number, number, number, number]): tf.Tensor4D {
    const [x, y, width, height] = bbox;

    return tf.tidy(() => {
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const cropWidth = Math.floor(width);
        const cropHeight = Math.floor(height);

        const [imageHeight, imageWidth, channels] = tensor.shape;

        const boundedStartX = Math.max(0, Math.min(startX, imageWidth - 1));
        const boundedStartY = Math.max(0, Math.min(startY, imageHeight - 1));
        const boundedWidth = Math.min(cropWidth, imageWidth - boundedStartX);
        const boundedHeight = Math.min(cropHeight, imageHeight - boundedStartY);

        // 裁剪并将值范围调整到 [0, 255]
        const croppedTensor = tf.slice(tensor, [boundedStartY, boundedStartX, 0], [boundedHeight, boundedWidth, channels]);

        return tf.cast(croppedTensor, 'int32');
    });
}

export function ObjectDetection({ id, selected, data }: NodeProps<Node<any, 'object-detection'>>) {
    const setRuntimeNodeData_ = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
    const setRuntimeNodeData = useCallback(setRuntimeNodeData_, [setRuntimeNodeData_]);
    const [form] = useForm();
    const tf = useTfjs();
    const updateNodeInternals = useUpdateNodeInternals();
    const cocoSsdModel = useCocoSsd();

    useEffect(() => {
        if (tf && cocoSsdModel) {
            const tracker = new SortTracker();
            const targetIdxs = data?.targets ? data.targets.reduce((pre: any, curr: any) => {
                if (!(curr.type in pre)) {
                    pre[curr.type] = [];
                }
                pre[curr.type].push({ idx: pre[curr.type].length + 1, fog: curr.fog });
                return pre;
            }, {} as any) : {};
            return useRuntimeNodeStore.subscribe(state => state.get(id, "tensor"), tensor => {
                if (tensor) {
                    const rgbTensor = tf.slice(tensor, [0, 0, 0], [-1, -1, 3]);
                    cocoSsdModel.detect(rgbTensor).then((predictions) => {
                        let detectedObjects = predictions
                            .filter(prediction => prediction.score > (data?.confidenceThreshold || 0))
                            .map(prediction => ({
                                class: classZh[prediction.class] || prediction.class,
                                classEn: prediction.class,
                                score: prediction.score,
                                bbox: prediction.bbox
                            } as Detection));
                        if (data?.tracking) {
                            detectedObjects = tracker.update(detectedObjects);
                            if (data?.targets?.length > 0) {
                                const detectedObjectGroups = detectedObjects.reduce((pre, curr) => {
                                    if (curr.classEn in pre) {
                                        pre[curr.classEn].push(curr);
                                    } else {
                                        pre[curr.classEn] = [curr];
                                    }
                                    return pre;
                                }, {} as any);
                                Object.keys(targetIdxs).forEach((type: string) => {
                                    targetIdxs[type].forEach(({ idx, fog }: any) => {
                                        if (detectedObjectGroups[type]?.[idx - 1]) {
                                            const object_ = detectedObjectGroups[type][idx - 1];
                                            const { bbox } = object_;
                                            setRuntimeNodeData({ [`${type.replace(/\s+/g, '_')}${idx}_stream`]: fog ? blurOutsideBBox(tensor, bbox) : cropAndNormalizeTensor(tensor, bbox) });
                                            setRuntimeNodeData({ [`${type.replace(/\s+/g, '_')}${idx}_object`]: object_ });
                                        } else {
                                            setRuntimeNodeData({ [`${type.replace(/\s+/g, '_')}${idx}_stream`]: null });
                                            setRuntimeNodeData({ [`${type.replace(/\s+/g, '_')}${idx}_object`]: null });
                                        }
                                    })
                                });
                            }
                        }
                        setRuntimeNodeData({ predictions: detectedObjects });
                    }).finally(() => rgbTensor.dispose());
                }
            }, { equalityFn: isEqual });
        }
    }, [tf, cocoSsdModel, data?.confidenceThreshold, data?.tracking, data?.targets]);

    return (
        <ResizableNode minWidth={280} id={id} data={data} selected={selected}>
            {() => <>
                <UseHandle
                    input={[{ id: "tensor", label: "视频流" }]}
                    output={[
                        { id: "predictions", label: '对象数据' },
                    ]}
                />
                <Form
                    form={form}
                    initialValues={data}
                    autoComplete="off"
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.Item label="置信度阈值" name="confidenceThreshold">
                        <Select allowClear className="nodrag nopan" options={[
                            { label: '0.2', value: 0.2 },
                            { label: '0.5', value: 0.5 },
                            { label: '0.7', value: 0.7 },
                        ]} />
                    </Form.Item>
                    <Form.Item label="跟踪" name="tracking">
                        <Switch></Switch>
                    </Form.Item>
                    {data?.tracking && <Form.List name={"targets"}>
                        {(fields, { add, remove }) => (<>
                            {fields.map(({ key, name, ...restField }) => {
                                const targets = form.getFieldValue("targets");
                                const typeEn = targets[name]?.type;
                                const type = classZh[typeEn] || typeEn;
                                let target = 1;
                                for (let i = 0; i < name; i++) {
                                    if (typeEn === targets[i]?.type) {
                                        target++;
                                    }
                                }
                                return <Flex vertical key={key} >
                                    <Space style={{ justifyContent: 'space-between' }}>
                                        <Space>
                                            <Form.Item style={{ minWidth: 130 }} label="类型" {...restField} name={[name, 'type']}>
                                                <Select showSearch optionFilterProp="label" className="nodrag nopan" options={Object.keys(classZh).map(key => ({
                                                    label: classZh[key],
                                                    value: key
                                                }))} />
                                            </Form.Item>
                                            <Form.Item label="雾化" {...restField} name={[name, 'fog']}>
                                                <Switch />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                        <UseHandle output={[
                                            { id: `${typeEn.replace(/\s+/g, '_')}${target}_stream`, label: `${type}${target}视频流` },
                                            { id: `${typeEn.replace(/\s+/g, '_')}${target}_object`, label: `${type}${target}对象数据` }
                                        ]} />
                                    </Space>
                                </Flex>;
                            })}
                            <Form.Item>
                                <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                    type: 'person',
                                })} >
                                    添加一项
                                </Button>
                            </Form.Item>
                        </>)}
                    </Form.List>}
                </Form>
            </>}
        </ResizableNode>
    );
}
