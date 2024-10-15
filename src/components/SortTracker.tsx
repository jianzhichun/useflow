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
    velocity: [number, number]; // 增加速度矢量，用于预测位置
}

interface AssociationResult {
    matched: Array<[number, number]>;
    unmatchedDetections: number[];
    unmatchedTracks: number[];
}

class SortTracker {
    private tracks: Track[] = [];
    private classCounters: { [key: string]: number } = {}; // 每种类别的编号计数器
    private maxAge: number = 5;
    private minHits: number = 1;
    private iouThreshold: number = 0.3;

    public update(detections: Detection[]): Track[] {
        // 更新现有轨迹的年龄并计算速度
        this.tracks.forEach(track => {
            const prevBBox = track.bbox;
            track.age++;
            const detection = detections.find(det => det.class === track.class && this.iou(det.bbox, prevBBox) > 0);
            if (detection) {
                const [x1, y1] = prevBBox;
                const [x2, y2] = detection.bbox;
                track.velocity = [x2 - x1, y2 - y1];
            }
        });

        // 关联检测结果与轨迹
        const matches = this.associateDetectionsToTracks(detections, this.tracks);

        // 更新已匹配的轨迹
        matches.matched.forEach(([detIdx, trackIdx]) => {
            const detection = detections[detIdx];
            this.tracks[trackIdx].bbox = detection.bbox;
            this.tracks[trackIdx].class = detection.class;
            this.tracks[trackIdx].score = detection.score;
            this.tracks[trackIdx].age = 0;
            this.tracks[trackIdx].hits++;
        });

        // 为未匹配的新检测创建新轨迹，并分配类别特定编号
        matches.unmatchedDetections.forEach(detIdx => {
            const detection = detections[detIdx];
            const target = this.getNextClassId(detection.class); // 获取类别特定编号
            this.tracks.push({
                target,
                ...detection,
                age: 0,
                hits: 1,
                velocity: [0, 0] // 初始速度为零
            });
        });

        // 移除未匹配且达到最大丢失帧数的轨迹
        this.tracks = this.tracks.filter(track => track.age < this.maxAge && track.hits >= this.minHits);

        return this.tracks.map(track => _.omit(track, []));
    }

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

    private associateDetectionsToTracks(detections: Detection[], tracks: Track[]): AssociationResult {
        const matched: Array<[number, number]> = [];
        const unmatchedDetections: number[] = [];
        const unmatchedTracks: Set<number> = new Set(tracks.map((_, i) => i));

        detections.forEach((det, detIdx) => {
            let bestMatch = -1;
            let highestIou = this.iouThreshold;

            tracks.forEach((track, trackIdx) => {
                if (track.class === det.class && unmatchedTracks.has(trackIdx)) {
                    const iouScore = this.iou(det.bbox, this.estimateNextPosition(track));
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

    private estimateNextPosition(track: Track): [number, number, number, number] {
        const [x, y, w, h] = track.bbox;
        const [vx, vy] = track.velocity;
        return [x + vx, y + vy, w, h];
    }

    private getNextClassId(className: string): number {
        // 如果该类别不存在计数器，则初始化为 1
        if (!this.classCounters[className]) {
            this.classCounters[className] = 1;
        }
        // 返回当前类别的编号并递增计数器
        return this.classCounters[className]++;
    }
}

export default SortTracker;
