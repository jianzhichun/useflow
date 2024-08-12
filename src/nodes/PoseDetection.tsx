import { NodeProps, NodeResizer } from '@xyflow/react';
import { type PoseDetection } from './types';
import { useEffect, useRef, useState } from 'react';
import { UseHandle } from './components/UseHandle';
import * as posedetection from '@tensorflow-models/pose-detection';

export function PoseDetection({ id, selected, data }: NodeProps<PoseDetection>) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (data.stream && videoRef.current) {
            const loadModelAndDetectPose = async () => {
                const detectorConfig = { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, detectorConfig);

                if (data.stream && videoRef.current) {
                    videoRef.current.srcObject = data.stream;
                    videoRef.current.onloadedmetadata = () => {
                        (videoRef.current as any).play();
                        detectPose(detector);
                    };
                }
            };

            const detectPose = async (detector:any) => {
                if (videoRef.current) {
                    const poses = await detector.estimatePoses(videoRef.current);
                    debugger
                    requestAnimationFrame(() => detectPose(detector));
                }
            };

            loadModelAndDetectPose();
            return () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                    tracks.forEach(track => track.stop());
                }
            };
        }
    }, [data.stream]);
    return (
        <div className="react-flow__node-default" style={{ width: "100%", height: "100%", padding: "0px" }}>
            <NodeResizer isVisible={selected || false} />
            <div>姿势识别</div>
            <UseHandle input={[{ id: "stream", label: "视频流" }]}></UseHandle>
            <video ref={videoRef} style={{ width: '100%' }} />
        </div>
    );
}
