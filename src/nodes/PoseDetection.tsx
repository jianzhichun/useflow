import { NodeProps, NodeResizer, ResizeParams } from '@xyflow/react';
import { type PoseDetection } from './types';
import { useEffect, useRef, useState } from 'react';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeDataStore } from '../App';

import '@tensorflow/tfjs-backend-webgl';
import '@mediapipe/pose';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs-core';
import * as posedetection from '@tensorflow-models/pose-detection';

import { Collapse } from 'antd';
import EditableTitle from '../components/EditableTitle';

tfjsWasm.setWasmPaths('node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/');

export const drawKeypoint = (ctx: CanvasRenderingContext2D, keypoint: any) => {
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}
export const drawKeypoints = (ctx: CanvasRenderingContext2D, keypoints: any[], options = { lineWidth: 2 }) => {
    const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
    ctx.fillStyle = 'Red';
    ctx.strokeStyle = 'Red';
    ctx.lineWidth = options.lineWidth;
    for (const i of keypointInd.middle) {
        drawKeypoint(ctx, keypoints[i]);
    }
    ctx.fillStyle = 'Green';
    ctx.strokeStyle = 'Green';
    for (const i of keypointInd.left) {
        drawKeypoint(ctx, keypoints[i]);
    }
    ctx.fillStyle = 'Orange';
    ctx.strokeStyle = 'Orange';
    for (const i of keypointInd.right) {
        drawKeypoint(ctx, keypoints[i]);
    }
}
export const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: any, options = { lineWidth: 2, color: '#ffffff' }) => {
    ctx.fillStyle = options.color;
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
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
export function PoseDetection({ id, selected, data }: NodeProps<PoseDetection>) {
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
            let detector: posedetection.PoseDetector | null = null;
            let frameId: number | null = null;
            async function draw() {
                await tf.ready();
                detector = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
                    runtime: 'mediapipe',
                    modelType: 'full',
                    solutionPath: 'node_modules/@mediapipe/pose'
                });

                video.srcObject = inputStream;
                video.onloadedmetadata = () => {
                    video.play();
                    async function detectPose() {
                        if (detector) {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
                            ctx.drawImage(video, 0, 0);
                            if (poses.length > 0) {
                                for (const pose of poses) {
                                    if (pose.keypoints != null) {
                                        drawKeypoints(ctx, pose.keypoints);
                                        drawSkeleton(ctx, pose.keypoints);
                                    }
                                    setRuntimeNodeData({ pose });
                                }
                            }
                            frameId = requestAnimationFrame(detectPose);
                        }
                    }
                    detectPose();
                }
                const stream = canvas.captureStream();
                setRuntimeNodeData({ skstream: stream });
            }
            draw();
            return () => {
                if (detector) {
                    detector.dispose();
                }
                if (frameId) {
                    cancelAnimationFrame(frameId);
                }
                const tracks = (video.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            };
        }
    }, [inputStream]);
    return (
        <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
            <NodeResizer minWidth={minWidth} isVisible={selected || false} onResizeEnd={(_, { width }: ResizeParams) => { setWidth(width) }} />
            <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
            <Collapse size="small" ghost
                items={[{ label: '备忘录', children: <img width={width} src='./pose-detection-lib/blazepose.png'></img> }]}>
            </Collapse>
            <UseHandle
                input={[{ id: "stream", label: "视频流" }]}
                output={[
                    { id: "pose", label: '姿态数据' },
                    { id: "skstream", label: '骨骼视频流' }
                ]}
            />
            <video ref={videoRef} autoPlay style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ width, height: "auto" }} />
        </div>
    );
}
