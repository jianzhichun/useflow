import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@mediapipe/selfie_segmentation';
import { useRef, useState } from 'react';
import { useTfjs } from './Tfjs';
import { useDeepCompareEffect } from 'ahooks';

type Config = bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig | bodySegmentation.MediaPipeSelfieSegmentationTfjsModelConfig | bodySegmentation.BodyPixModelConfig;

class BodySegmenterSingleton {
    private static promiseInstances: Map<string, Promise<bodySegmentation.BodySegmenter>> = new Map();
    private static creating = false;
    private constructor() { }
    public static async getInstance(model: bodySegmentation.SupportedModels, config: Config): Promise<bodySegmentation.BodySegmenter> {
        const key = `${model}_${JSON.stringify(config)}`;
        if (!BodySegmenterSingleton.promiseInstances.has(key)) {
            const detectorPromise = new Promise<bodySegmentation.BodySegmenter>(async (resolve, reject) => {
                if (BodySegmenterSingleton.promiseInstances.has(key)) {
                    resolve(BodySegmenterSingleton.promiseInstances.get(key)!);
                } else {
                    if (BodySegmenterSingleton.creating) {
                        while (BodySegmenterSingleton.creating) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    try {
                        BodySegmenterSingleton.creating = true;
                        const detector = await bodySegmentation.createSegmenter(model, config);
                        BodySegmenterSingleton.creating = false;
                        resolve(detector);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            BodySegmenterSingleton.promiseInstances.set(key, detectorPromise);
        }
        return BodySegmenterSingleton.promiseInstances.get(key)!;
    }
    public static async disposeInstance(model: bodySegmentation.SupportedModels, config: Config) {
        const key = `${model}_${JSON.stringify(config)}`;
        const detector = await this.promiseInstances.get(key);
        if (detector) {
            detector.dispose();
            this.promiseInstances.delete(key);
        }
    }
}

export const useBodySegmenter = (model: bodySegmentation.SupportedModels = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, config: Config = {
    runtime: 'mediapipe',
    modelType: "general",
    // solutionPath: 'node_modules/@mediapipe/selfie_segmentation'
}): bodySegmentation.BodySegmenter | null => {
    const detectorRef = useRef<bodySegmentation.BodySegmenter | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tf = useTfjs();
    useDeepCompareEffect(() => {
        let isMounted = true;
        if (tf) {
            console.log('Loading body segmenter...', config);
            BodySegmenterSingleton.getInstance(model, config).then(detector => {
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

