import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@mediapipe/selfie_segmentation';
import { useRef, useState } from 'react';
import { useTfjs } from './Tfjs';
import { useDeepCompareEffect } from 'ahooks';
import { ModelHolder } from './Constant';

type Config = bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig | bodySegmentation.MediaPipeSelfieSegmentationTfjsModelConfig | bodySegmentation.BodyPixModelConfig;

class BodySegmenterSingleton {
    private constructor() { }
    public static async getInstance(model: bodySegmentation.SupportedModels, config: Config): Promise<bodySegmentation.BodySegmenter> {
        const key = `${model}_${JSON.stringify(config)}`;
        if (!ModelHolder.bodySegmenterPromises.has(key)) {
            const detectorPromise = new Promise<bodySegmentation.BodySegmenter>(async (resolve, reject) => {
                if (ModelHolder.bodySegmenterPromises.has(key)) {
                    resolve(ModelHolder.bodySegmenterPromises.get(key)!);
                } else {
                    if (ModelHolder.creating) {
                        while (ModelHolder.creating) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    try {
                        ModelHolder.creating = true;
                        const detector = await bodySegmentation.createSegmenter(model, config);
                        ModelHolder.creating = false;
                        resolve(detector);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            ModelHolder.bodySegmenterPromises.set(key, detectorPromise);
        }
        return ModelHolder.bodySegmenterPromises.get(key)!;
    }
    public static async disposeInstance(model: bodySegmentation.SupportedModels, config: Config) {
        const key = `${model}_${JSON.stringify(config)}`;
        const detector = await ModelHolder.bodySegmenterPromises.get(key);
        if (detector) {
            detector.dispose();
            ModelHolder.bodySegmenterPromises.delete(key);
        }
    }
}

export const useBodySegmenter = (model: bodySegmentation.SupportedModels = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, config: Config = {
    runtime: 'mediapipe',
    modelType: "general",
    solutionPath: 'node_modules/@mediapipe/selfie_segmentation'
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

