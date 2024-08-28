import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
// tfjsWasm.setWasmPaths('node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/');

import { useEffect, useRef, useState } from 'react';

class TfjsSingleton {
    private static promiseInstance: Promise<typeof tf>;
    private constructor() { }
    public static async getInstance(): Promise<typeof tf> {
        if (!TfjsSingleton.promiseInstance) {
            TfjsSingleton.promiseInstance = new Promise<typeof tf>(async (resolve, reject) => {
                try {
                    await tf.ready();
                    const backends = ['wasm', 'webgl', 'webgpu', 'cpu'];
                    for (const backend of backends) {
                        try {
                            const success = await tf.setBackend(backend);
                            if (success) {
                                console.log(`Using backend: ${backend}`);
                                break;
                            }
                        } catch (e) {
                            console.warn(`Failed to set backend ${backend}:`, e);
                        }
                    }
                    tf.env().setFlags({});
                    resolve(tf);
                } catch (e) {
                    reject(e);
                }
            });
        }
        return TfjsSingleton.promiseInstance;
    }
}
export const useTfjs = (): typeof tf | null => {
    const tfjsInstanceRef = useRef<typeof tf | null>(null);
    const [isTfjsLoaded, setIsTfjsLoaded] = useState(false);
    useEffect(() => {
        let isMounted = true;
        const loadTfjs = async () => {
            const instance = await TfjsSingleton.getInstance();
            if (isMounted) {
                tfjsInstanceRef.current = instance;
                setIsTfjsLoaded(true);
            }
        };
        loadTfjs();
        return () => {
            isMounted = false;
        };
    }, []);
    return isTfjsLoaded ? tfjsInstanceRef.current : null;
};
export function toPixels(tensor: tf.Tensor2D | tf.Tensor3D | tf.TensorLike, canvas: HTMLCanvasElement) {
    return tf.browser.toPixels(tensor, canvas);
}