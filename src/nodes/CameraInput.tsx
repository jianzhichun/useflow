import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { type CameraInput } from './types';
import { useEffect, useState } from 'react';
import { Select, Form, Switch } from 'antd';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../App';
import { useTfjs } from '../components/Tfjs';
import ResizableNode from '../components/ResizableNode';

export function CameraInput({ id, selected, data }: NodeProps<CameraInput>) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const updateNodeInternals = useUpdateNodeInternals();
  const setRuntimeNodeData = useRuntimeNodeStore(state => (nodeData: any) => state.set(id, nodeData));
  const tf = useTfjs();
  useEffect(() => {
    async function getDevices() {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
    }
    getDevices();
  }, []);
  useEffect(() => {
    if (data?.selectedDeviceId && tf) {
      const videoElement = document.createElement('video');
      let frid: number;
      async function play() {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: data.selectedDeviceId } }
        });
        videoElement.srcObject = mediaStream;
        videoElement.onloadeddata = () => {
          async function processFrame() {
            if (tf) {
              const tensor = await tf.browser.fromPixelsAsync(videoElement, 4);
              if (data?.isMirrored) {
                const mirroredTensor = tf.reverse(tensor, [1]);
                setRuntimeNodeData({ tensor: mirroredTensor });
                tensor.dispose();
              } else {
                setRuntimeNodeData({ tensor });
              }
              frid = requestAnimationFrame(processFrame);
            }
          }
          processFrame();
        };
        videoElement.play();
      }
      play();
      return () => {
        cancelAnimationFrame(frid);
        videoElement.pause();
        if (videoElement.srcObject) {
          const tracks = (videoElement.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        videoElement.srcObject = null;
      };
    }
  }, [tf, data?.selectedDeviceId, data?.isMirrored]);

  return (
    <ResizableNode data={data} selected={selected}>
      {(width) => <>
        <UseHandle output={[{ id: "tensor", label: "视频流" }]}></UseHandle>
        <Form size="small" colon style={{width}}
          initialValues={data}
          onValuesChange={(_, values) => {
            Object.assign(data, values);
            updateNodeInternals(id);
          }}
        >
          <Form.Item label="设备" name="selectedDeviceId" >
            <Select allowClear className="nodrag nopan" options={devices.map(({ label, deviceId }) => ({ label, value: deviceId }))} />
          </Form.Item>
          <Form.Item label="镜像" name="isMirrored" >
            <Switch />
          </Form.Item>
        </Form>
      </>}
    </ResizableNode>
  );

}
