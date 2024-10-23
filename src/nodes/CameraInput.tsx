import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import { Select, Form, Switch, Input } from 'antd';
import UseHandle from '../components/UseHandle';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import { useTfjs } from '../components/Tfjs';
import ResizableNode from '../components/ResizableNode';
import { useForm } from 'antd/es/form/Form';
import { requestCameraPermission } from '../components/Utils';
import Hls from 'hls.js';

export function CameraInput({ id, selected, data }: NodeProps<Node<any, 'camera-input'>>) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const updateNodeInternals = useUpdateNodeInternals();
  const setRuntimeNodeData_ = useRuntimeNodeStore((state) => (nodeData: any) => state.set(id, nodeData));
  const setRuntimeNodeData = useCallback(setRuntimeNodeData_, [setRuntimeNodeData_]);
  const tf = useTfjs();
  const [form] = useForm();
  useEffect(() => {
    async function getDevices() {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
    }
    getDevices();
    requestCameraPermission();
  }, []);
  useEffect(() => {
    if (!tf) return;
    if (data?.isUsingVideoSrc && data?.videoSrc) {
      if (data?.videoSrc.includes('open.ys7.com')) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.width = 640;
        videoElement.height = 480;
        let frid: number;
        videoElement.addEventListener('loadeddata', () => {
          async function processStream() {
            if (tf) {
              const tensor = await tf.browser.fromPixelsAsync(videoElement);
              if (data?.isMirrored) {
                const mirroredTensor = tf.reverse(tensor, [1]);
                setRuntimeNodeData({ tensor: mirroredTensor });
                tensor.dispose();
              } else {
                setRuntimeNodeData({ tensor });
              }
              frid = requestAnimationFrame(processStream);
            }
          }
          processStream();
        });
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(data.videoSrc);
          hls.attachMedia(videoElement);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play();
          });
          return () => {
            cancelAnimationFrame(frid);
            hls.destroy();
            videoElement.remove();
          };
        }
      } else {
        const imageElement = new Image();
        let frid: number;
        function fetchAndProcessStream(url: string) {
          imageElement.crossOrigin = 'anonymous';
          imageElement.src = url;
          async function processStream() {
            if (tf) {
              const tensor = await tf.browser.fromPixelsAsync(imageElement, 4);
              if (data?.isMirrored) {
                const mirroredTensor = tf.reverse(tensor, [1]);
                setRuntimeNodeData({ tensor: mirroredTensor });
                tensor.dispose();
              } else {
                setRuntimeNodeData({ tensor });
              }
              frid = requestAnimationFrame(processStream);
            }
          }
          imageElement.onload = processStream;
        }
        fetchAndProcessStream(data.videoSrc);
        return () => {
          cancelAnimationFrame(frid);
          if (imageElement) {
            imageElement.src = '';
            imageElement.onload = null;
          }
        };
      }
    } else if (data?.selectedDeviceId) {
      const videoElement = document.createElement('video');
      let frid: number;
      async function play() {
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: data.selectedDeviceId } }
          });
        } catch (error: any) {
          if (error.name === 'OverconstrainedError') {
            if (form) {
              form.setFieldValue("selectedDeviceId", devices.find((device) => device.kind === 'videoinput')?.deviceId);
            }
            Object.assign(data, {
              selectedDeviceId: devices.find((device) => device.kind === 'videoinput')?.deviceId
            });
            updateNodeInternals(id);
          }
        }
        if (mediaStream) {
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
  }, [tf, data?.isUsingVideoSrc, data?.videoSrc, data?.selectedDeviceId, data?.isMirrored]);

  return (
    <ResizableNode id={id} data={data} selected={selected}>
      {() => <>
        <UseHandle output={[{ id: "tensor", label: "视频流" }]}></UseHandle>
        <Form colon form={form}
          initialValues={data}
          onValuesChange={(_, values) => {
            Object.assign(data, values);
            updateNodeInternals(id);
          }}
        >
          <Form.Item label="使用视频流 URL" name="isUsingVideoSrc" valuePropName="checked">
            <Switch />
          </Form.Item>
          {data?.isUsingVideoSrc ? (
            <Form.Item label="视频流 URL" name="videoSrc">
              <Input />
            </Form.Item>
          ) : (
            <Form.Item label="设备" name="selectedDeviceId">
              <Select allowClear className="nodrag nopan" options={devices.map(({ label, deviceId }) => ({ label, value: deviceId }))} />
            </Form.Item>
          )}
          <Form.Item label="镜像" name="isMirrored" >
            <Switch />
          </Form.Item>
        </Form>
      </>}
    </ResizableNode>
  );

}
