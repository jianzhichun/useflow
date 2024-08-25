import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@mediapipe/hands';
import { useRef, useState } from 'react';
import { useTfjs } from './Tfjs';
import { useDeepCompareEffect } from 'ahooks';
import { Keypoint } from '@tensorflow-models/hand-pose-detection';

type Config = handPoseDetection.MediaPipeHandsMediaPipeModelConfig | handPoseDetection.MediaPipeHandsTfjsModelConfig;

const fingerLookupIndices: { [key: string]: number[] } = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
};

export function drawKeypoints(
    ctx: CanvasRenderingContext2D, keypoints: Keypoint[], handedness: string, drawKeypoints: boolean = true, drawSkeleton: boolean = true,
    options: any = {
        keypointLineWidth: 2,
        skeletonLineWidth: 2,
        skeletonColor: '#ffffff'
    }
) {
    ctx.fillStyle = handedness === 'Left' ? 'Red' : 'Blue';
    ctx.strokeStyle = 'White';
    ctx.lineWidth = options?.keypointLineWidth || 2;

    if (drawKeypoints) {
        keypoints.forEach(keypoint => {
            const { x, y } = keypoint;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }

    if (drawSkeleton) {
        Object.keys(fingerLookupIndices).forEach(finger => {
            const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
            ctx.fillStyle = options?.skeletonColor || '#ffffff';
            ctx.strokeStyle = options?.skeletonColor || '#ffffff';
            ctx.lineWidth = options?.skeletonLineWidth || 2;
            drawPath(ctx, points, false);
        });
    }
}

function drawPath(ctx: CanvasRenderingContext2D, points: Keypoint[], closePath: boolean) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    if (closePath) {
        ctx.closePath();
    }
    ctx.stroke();
}

class HandPoseDetectorSingleton {
    private static promiseInstances: Map<string, Promise<handPoseDetection.HandDetector>> = new Map();
    private static creating = false;
    private constructor() { }
    public static async getInstance(model: handPoseDetection.SupportedModels, config: Config): Promise<handPoseDetection.HandDetector> {
        const key = `${model}_${JSON.stringify(config)}`;
        if (!HandPoseDetectorSingleton.promiseInstances.has(key)) {
            const detectorPromise = new Promise<handPoseDetection.HandDetector>(async (resolve, reject) => {
                if (HandPoseDetectorSingleton.promiseInstances.has(key)) {
                    resolve(HandPoseDetectorSingleton.promiseInstances.get(key)!);
                } else {
                    if (HandPoseDetectorSingleton.creating) {
                        while (HandPoseDetectorSingleton.creating) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    try {
                        HandPoseDetectorSingleton.creating = true;
                        const detector = await handPoseDetection.createDetector(model, config);
                        HandPoseDetectorSingleton.creating = false;
                        resolve(detector);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            HandPoseDetectorSingleton.promiseInstances.set(key, detectorPromise);
        }
        return HandPoseDetectorSingleton.promiseInstances.get(key)!;
    }
    public static async disposeInstance(model: handPoseDetection.SupportedModels, config: Config) {
        const key = `${model}_${JSON.stringify(config)}`;
        const detector = await this.promiseInstances.get(key);
        if (detector) {
            detector.dispose();
            this.promiseInstances.delete(key);
        }
    }
}

export const useHandPoseDetector = (model: handPoseDetection.SupportedModels = handPoseDetection.SupportedModels.MediaPipeHands, config: Config = {
    runtime: 'mediapipe',
    solutionPath: 'node_modules/@mediapipe/hands'
}): handPoseDetection.HandDetector | null => {
    const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tf = useTfjs();
    useDeepCompareEffect(() => {
        let isMounted = true;
        if (tf) {
            console.log('Loading hand pose detector...', config);
            HandPoseDetectorSingleton.getInstance(model, config).then(detector => {
                if (isMounted) {
                    detectorRef.current = detector;
                    setIsLoaded(true);
                }
            });
        }
        return () => {
            isMounted = false;
            detectorRef.current = null;
        };
    }, [tf, model, config]);

    return isLoaded ? detectorRef.current : null;
};

