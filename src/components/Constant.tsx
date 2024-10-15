import { BodySegmenter } from '@tensorflow-models/body-segmentation';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { PoseDetector } from '@tensorflow-models/pose-detection';
import { ObjectDetection } from '@tensorflow-models/coco-ssd';

class ModelHolder {
    public static bodySegmenterPromises: Map<string, Promise<BodySegmenter>> = new Map();
    public static handDetectorPromises: Map<string, Promise<HandDetector>> = new Map();
    public static poseDetectorPromises: Map<string, Promise<PoseDetector>> = new Map();
    public static cocoSsdPromises: Map<string, Promise<ObjectDetection>> = new Map();
    public static creating = false;
}
export { ModelHolder };