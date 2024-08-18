import { NodeProps, NodeResizer, ResizeParams } from '@xyflow/react';
import { type PoseDetection } from './types';
import { useEffect, useRef, useState } from 'react';
import { UseHandle } from './components/UseHandle';
import { useRuntimeNodeDataStore } from '../App';

import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';
import '@mediapipe/pose';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs-core';
import * as posedetection from '@tensorflow-models/pose-detection';

import { Collapse } from 'antd';

tfjsWasm.setWasmPaths('./pose-detection-lib/');

export function PoseDetection({ id, selected }: NodeProps<PoseDetection>) {
    const minWidth = 200;
    const [width, setWidth] = useState(minWidth);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputStream = useRuntimeNodeDataStore((state: any) => state.getInputParam(id, "stream"));
    const setRuntimeNodeData = useRuntimeNodeDataStore((state: any) => (nodeData: any) => state.setNodeData(id, nodeData));

    useEffect(() => {
        if (inputStream && videoRef.current && canvasRef.current) {
            const video = videoRef.current as HTMLVideoElement;
            const canvas = canvasRef.current as HTMLCanvasElement;
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            video.srcObject = inputStream;
            video.onloadedmetadata = () => {
                video.play();
                const drawKeypoint = (keypoint: any) => {
                    const score = keypoint.score != null ? keypoint.score : 1;
                    const scoreThreshold = 0;

                    if (score >= scoreThreshold) {
                        const circle = new Path2D();
                        circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
                        ctx.fill(circle);
                        ctx.stroke(circle);
                    }
                }
                const drawKeypoints = (keypoints: any[]) => {
                    const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
                    ctx.fillStyle = 'Red';
                    ctx.strokeStyle = 'White';
                    ctx.lineWidth = 2;
                    for (const i of keypointInd.middle) {
                        drawKeypoint(keypoints[i]);
                    }
                    ctx.fillStyle = 'Green';
                    for (const i of keypointInd.left) {
                        drawKeypoint(keypoints[i]);
                    }
                    ctx.fillStyle = 'Orange';
                    for (const i of keypointInd.right) {
                        drawKeypoint(keypoints[i]);
                    }
                }
                const drawSkeleton = (keypoints: any) => {
                    const color = '#ffffff';
                    ctx.fillStyle = color;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose).forEach(([
                        i, j
                    ]) => {
                        const kp1 = keypoints[i];
                        const kp2 = keypoints[j];

                        const score1 = kp1.score != null ? kp1.score : 1;
                        const score2 = kp2.score != null ? kp2.score : 1;
                        const scoreThreshold = 0;

                        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
                            ctx.beginPath();
                            ctx.moveTo(kp1.x, kp1.y);
                            ctx.lineTo(kp2.x, kp2.y);
                            ctx.stroke();
                        }
                    });
                }
                const detectPose = async (detector: any) => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const poses = await detector.estimatePoses(videoRef.current, { maxPoses: 1, flipHorizontal: false });
                    ctx?.drawImage(video, 0, 0);
                    if (poses?.length > 0) {
                        setRuntimeNodeData({ poses });
                        for (const pose of poses) {
                            if (pose.keypoints != null) {
                                drawKeypoints(pose.keypoints);
                                drawSkeleton(pose.keypoints);
                            }
                        }
                    }
                    requestAnimationFrame(() => detectPose(detector));
                };
                const loadModelAndDetectPose = async () => {
                    await tf.ready();
                    const detector = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
                        runtime: 'mediapipe',
                        modelType: 'full',
                        solutionPath: './pose-detection-lib/'
                    });
                    detectPose(detector);
                };
                loadModelAndDetectPose();
                const stream = canvas.captureStream();
                setRuntimeNodeData({ skstream: stream });
            };
            return () => {
                const tracks = (video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            };
        }
    }, [inputStream]);
    return (
        <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
            <NodeResizer minWidth={minWidth} isVisible={selected || false} onResizeEnd={(_, { width }: ResizeParams) => { setWidth(width) }} />
            <div>姿势识别</div>
            <Collapse size="small" ghost
                items={[{ label: '备忘录', children: <img width={width} src='./pose-detection-lib/blazepose.png'></img> }]}>
            </Collapse>
            <UseHandle
                input={[{ id: "stream", label: "视频流" }]}
                output={[
                    { id: "poses", label: '姿态数据' },
                    { id: "skstream", label: '骨骼视频流' }
                ]}
            />
            <video ref={videoRef} autoPlay style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ width, height: "auto" }} />
        </div>
    );
}
