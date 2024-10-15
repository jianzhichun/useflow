import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { useRef, useState } from 'react';
import { useTfjs } from './Tfjs';
import { useDeepCompareEffect } from 'ahooks';
import { ModelHolder } from './Constant';

class CocoSsdSingleton {
    private constructor() { }
    public static async getInstance(): Promise<cocoSsd.ObjectDetection> {
        const key = 'cocoSsd';
        if (!ModelHolder.cocoSsdPromises.has(key)) {
            const modelPromise = new Promise<cocoSsd.ObjectDetection>(async (resolve, reject) => {
                if (ModelHolder.cocoSsdPromises.has(key)) {
                    resolve(ModelHolder.cocoSsdPromises.get(key)!);
                } else {
                    if (ModelHolder.creating) {
                        while (ModelHolder.creating) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    try {
                        ModelHolder.creating = true;
                        const model = await cocoSsd.load({ modelUrl: './ssdlite_mobilenet_v2/model.json' });
                        ModelHolder.creating = false;
                        resolve(model);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            ModelHolder.cocoSsdPromises.set(key, modelPromise);
        }
        return ModelHolder.cocoSsdPromises.get(key)!;
    }

    public static async disposeInstance() {
        const key = 'cocoSsd';
        const model = await ModelHolder.cocoSsdPromises.get(key);
        if (model) {
            model.dispose();
            ModelHolder.cocoSsdPromises.delete(key);
        }
    }
};

export const useCocoSsd = (): cocoSsd.ObjectDetection | null => {
    const detectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tf = useTfjs();

    useDeepCompareEffect(() => {
        let isMounted = true;
        if (tf) {
            console.log('Loading Coco-SSD model...');
            CocoSsdSingleton.getInstance().then(detector => {
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
    }, [tf]);

    return isLoaded ? detectorRef.current : null;
};
