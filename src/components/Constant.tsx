import { BodySegmenter } from '@tensorflow-models/body-segmentation';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { PoseDetector } from '@tensorflow-models/pose-detection';

class ModelHolder {
    public static bodySegmenterPromises: Map<string, Promise<BodySegmenter>> = new Map();
    public static handDetectorPromises: Map<string, Promise<HandDetector>> = new Map();
    public static poseDetectorPromises: Map<string, Promise<PoseDetector>> = new Map();
    public static creating = false;
}
export { ModelHolder };