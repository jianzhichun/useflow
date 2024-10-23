import _ from "lodash";

export interface Detection {
    bbox: [number, number, number, number];
    class: string;
    classEn: string;
    score: number;
}

export interface Track extends Detection {
    target: number;
    age: number;
    hits: number;
    velocity: [number, number]; // 速度矢量，用于预测位置
}

interface AssociationResult {
    matched: Array<[number, number]>;
    unmatchedDetections: number[];
    unmatchedTracks: number[];
}

class SortTracker {
    private tracks: Track[] = [];
    private classCounters: { [key: string]: number } = {}; // 每种类别的编号计数器
    private availableTargets: number[] = []; // 空闲的 target 池
    private maxAge: number = 5; // 最大轨迹生命周期
    private minHits: number = 3; // 最小匹配次数
    private iouThreshold: number = 0.3; // IoU 阈值

    public update(detections: Detection[]): Track[] {
        // 更新现有轨迹的年龄
        this.tracks.forEach(track => {
            const prevBBox = track.bbox;
            track.age++;
            const detection = detections.find(det => det.class === track.class && this.iou(det.bbox, prevBBox) > this.iouThreshold);
            
            if (detection) {
                // 更新速度向量
                const [x1, y1] = prevBBox;
                const [x2, y2] = detection.bbox;
                track.velocity = [x2 - x1, y2 - y1];
                // 更新轨迹
                track.bbox = detection.bbox;
                track.age = 0; // 重置轨迹年龄
                track.hits++;
            } else {
                track.hits /= 2;
            }
        });

        // 关联检测结果与轨迹
        const matches = this.associateDetectionsToTracks(detections, this.tracks);

        // 为未匹配的新检测创建新轨迹
        matches.unmatchedDetections.forEach(detIdx => {
            const detection = detections[detIdx];

            // 创建新轨迹，优先复用空闲的 target ID
            const target = this.getNextTargetId(detection.class);
            this.tracks.push({
                target,
                ...detection,
                age: 0,
                hits: 1,
                velocity: [0, 0] // 初始速度为零
            });
        });

        // 移除未匹配且达到最大丢失帧数的轨迹，并回收 target ID
        this.tracks = this.tracks.filter(track => {
            if (track.age >= this.maxAge && track.hits < this.minHits) {
                // 将删除的轨迹的 target ID 回收到空闲池中
                this.availableTargets.push(track.target);
                return false;
            }
            return true;
        });

        // 返回当前的轨迹
        return this.tracks.map(track => _.omit(track, []));
    }

    // 从空闲池获取 target ID，如果没有可用 ID 则递增
    private getNextTargetId(className: string): number {
        if (this.availableTargets.length > 0) {
            return this.availableTargets.shift()!; // 从空闲池中取出一个 ID
        }

        // 如果没有空闲 ID，递增编号
        if (!this.classCounters[className]) {
            this.classCounters[className] = 1; // 初始化类别编号
        }
        return this.classCounters[className]++;
    }

    // 计算两个检测框的IoU
    private iou(bbox1: [number, number, number, number], bbox2: [number, number, number, number]): number {
        const [x1, y1, w1, h1] = bbox1;
        const [x2, y2, w2, h2] = bbox2;

        const xi1 = Math.max(x1, x2);
        const yi1 = Math.max(y1, y2);
        const xi2 = Math.min(x1 + w1, x2 + w2);
        const yi2 = Math.min(y1 + h1, y2 + h2);
        const interArea = Math.max(0, xi2 - xi1) * Math.max(0, yi2 - yi1);

        const bbox1Area = w1 * h1;
        const bbox2Area = w2 * h2;
        const unionArea = bbox1Area + bbox2Area - interArea;

        return interArea / unionArea;
    }

    // 匹配检测结果与轨迹
    private associateDetectionsToTracks(detections: Detection[], tracks: Track[]): AssociationResult {
        const matched: Array<[number, number]> = [];
        const unmatchedDetections: number[] = [];
        const unmatchedTracks: Set<number> = new Set(tracks.map((_, i) => i));

        detections.forEach((det, detIdx) => {
            let bestMatch = -1;
            let highestIou = this.iouThreshold;

            tracks.forEach((track, trackIdx) => {
                if (track.class === det.class && unmatchedTracks.has(trackIdx)) {
                    const iouScore = this.iou(det.bbox, track.bbox);
                    if (iouScore > highestIou) {
                        bestMatch = trackIdx;
                        highestIou = iouScore;
                    }
                }
            });

            if (bestMatch >= 0) {
                matched.push([detIdx, bestMatch]);
                unmatchedTracks.delete(bestMatch);
            } else {
                unmatchedDetections.push(detIdx);
            }
        });

        return { matched, unmatchedDetections, unmatchedTracks: Array.from(unmatchedTracks) };
    }
}

export default SortTracker;
