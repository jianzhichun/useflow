import { NodeProps, useUpdateNodeInternals, NodeResizer, ResizeParams } from '@xyflow/react';
import { type CameraInput } from './types';
import { useEffect, useRef, useState } from 'react';
import { Select, Form, Switch } from 'antd';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeDataStore } from '../App';
import EditableTitle from '../components/EditableTitle';

export function CameraInput({ id, selected, data }: NodeProps<CameraInput>) {
  const minWidth = 200;
  const [width, setWidth] = useState(minWidth);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const setRuntimeNodeData = useRuntimeNodeDataStore((state: any) => (nodeData: any) => state.setNodeData(id, nodeData));
  useEffect(() => {
    async function getDevices() {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
    }
    getDevices();
  }, []);
  useEffect(() => {
    async function getCameraStream(deviceId: string) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        return mediaStream;
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    if (data.selectedDeviceId) {
      getCameraStream(data.selectedDeviceId);
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const draw = () => {
          if (context && videoRef.current) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            if (data.isMirrored) {
              context.scale(-1, 1);
              context.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
            } else {
              context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            }
            context.restore();
          }
          requestAnimationFrame(draw);
        };

        videoRef.current.addEventListener('loadedmetadata', () => {
          if (videoRef?.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
          }
        });

        draw();
        const stream = canvas.captureStream();
        setRuntimeNodeData({ stream });

        return () => {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
        };
      }
    }
  }, [data.selectedDeviceId, data.isMirrored]);

  return (
    <div className="react-flow__node-default" style={{ minWidth, width: "100%", height: "100%", padding: "0px" }}>
      <NodeResizer minWidth={minWidth} isVisible={selected || false} onResizeEnd={(_, { width }: ResizeParams) => { setWidth(width) }} />
      <EditableTitle title={data.label} onChange={(title) => { Object.assign(data, { label: title }) }}></EditableTitle>
      <UseHandle output={[{ id: "stream", label: "视频流" }]}></UseHandle>
      <Form size="small" colon style={{ width }}
        initialValues={data}
        onValuesChange={(_, values) => {
          Object.assign(data, values);
          updateNodeInternals(id);
        }}
      >
        <Form.Item label="设备" name="selectedDeviceId" >
          <Select className="nodrag nopan" options={devices.map(({ label, deviceId }) => ({ label, value: deviceId }))} />
        </Form.Item>
        <Form.Item label="镜像" name="isMirrored" >
          <Switch />
        </Form.Item>
      </Form>
      <video ref={videoRef} autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ width, height: "auto" }} />
    </div>
  );

}
