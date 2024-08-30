import { useState, useRef } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import '@mediapipe/pose';
import { useTfjs } from './Tfjs';
import { useDeepCompareEffect } from 'ahooks';
import { ModelHolder } from './Constant';

type Config = posedetection.PosenetModelConfig | posedetection.BlazePoseTfjsModelConfig | posedetection.BlazePoseMediaPipeModelConfig | posedetection.MoveNetModelConfig | undefined;

function drawKeypoint(ctx: CanvasRenderingContext2D, keypoint: posedetection.Keypoint) {
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}
export function drawKeypoints(ctx: CanvasRenderingContext2D, keypoints: posedetection.Keypoint[], options: any = { lineWidth: 2 }) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
    ctx.fillStyle = 'Red';
    ctx.strokeStyle = 'Red';
    ctx.lineWidth = options?.lineWidth || 2;
    for (const i of keypointInd.middle) {
        if (!(options?.excludeKeypoints || []).includes(i)) {
            drawKeypoint(ctx, keypoints[i]);
        }
    }
    ctx.fillStyle = 'Green';
    ctx.strokeStyle = 'Green';
    for (const i of keypointInd.left) {
        if (!(options?.excludeKeypoints || []).includes(i)) {
            drawKeypoint(ctx, keypoints[i]);
        }
    }
    ctx.fillStyle = 'Orange';
    ctx.strokeStyle = 'Orange';
    for (const i of keypointInd.right) {
        if (!(options?.excludeKeypoints || []).includes(i)) {
            drawKeypoint(ctx, keypoints[i]);
        }
    }
}
export function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: posedetection.Keypoint[], options: any = { lineWidth: 2, color: '#ffffff' }) {
    ctx.fillStyle = options?.color || '#ffffff';
    ctx.strokeStyle = options?.color || '#ffffff';
    ctx.lineWidth = options?.lineWidth || 2;
    posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose).forEach(([
        i, j
    ]) => {
        if ((options?.excludeKeypoints || []).includes(i) || (options?.excludeKeypoints || []).includes(j)) {
            return;
        }
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
class PoseDetectorSingleton {
    private constructor() { }
    public static async getInstance(model: posedetection.SupportedModels, config: Config): Promise<posedetection.PoseDetector> {
        const key = `${model}_${JSON.stringify(config)}`;
        if (!ModelHolder.poseDetectorPromises.has(key)) {
            const detectorPromise = new Promise<posedetection.PoseDetector>(async (resolve, reject) => {
                if (ModelHolder.poseDetectorPromises.has(key)) {
                    resolve(ModelHolder.poseDetectorPromises.get(key)!);
                } else {
                    if (ModelHolder.creating) {
                        while (ModelHolder.creating) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    try {
                        ModelHolder.creating = true;
                        const detector = await posedetection.createDetector(model, config);
                        ModelHolder.creating = false;
                        resolve(detector);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            ModelHolder.poseDetectorPromises.set(key, detectorPromise);
        }
        return ModelHolder.poseDetectorPromises.get(key)!;
    }
    public static async disposeInstance(model: posedetection.SupportedModels, config: Config) {
        const key = `${model}_${JSON.stringify(config)}`;
        const detector = await ModelHolder.poseDetectorPromises.get(key);
        if (detector) {
            detector.dispose();
            ModelHolder.poseDetectorPromises.delete(key);
        }
    }
}

export const usePoseDetector = (model: posedetection.SupportedModels = posedetection.SupportedModels.BlazePose, config: Config = {
    runtime: 'mediapipe',
    modelType: "full",
    solutionPath: 'node_modules/@mediapipe/pose'
}): posedetection.PoseDetector | null => {
    const detectorRef = useRef<posedetection.PoseDetector | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tf = useTfjs();
    useDeepCompareEffect(() => {
        let isMounted = true;
        if (tf) {
            console.log('Loading pose detector...', config);
            PoseDetectorSingleton.getInstance(model, config).then(detector => {
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

