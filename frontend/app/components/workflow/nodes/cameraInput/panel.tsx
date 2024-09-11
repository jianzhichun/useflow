"use client";

import type { FC } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CameraNodeType } from "./types";
import type { InputVar, NodePanelProps } from "@/app/components/workflow/types";
import { requestCameraPermission } from "@/app/utils";
import Select from "@/app/components/base/select";
import Switch from "@/app/components/base/switch";
import { useForm, useWatch } from "react-hook-form";

// const i18nPrefix = 'workflow.nodes.start'

const deviceFormSchema = z.object({
  // device: z
  //   .string()
  //   .min(1, { message: "login.error.emailInValid" })
  //   .email("login.error.emailInValid"),
});

type DeviceFormValues = {
  deviceId: string;
  isMirror: boolean;
};;

const Panel: FC<NodePanelProps<CameraNodeType>> = ({ id, data }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [openPreview, setOpenPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue, // 添加这行
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      deviceId: '',
      isMirror: false,
    },
  })
  
  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (error) {
        console.error("无法获取摄像头权限:", error);
        return;
      }
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter(
        (device) => device.kind === "videoinput"
      );
      setDevices(videoDevices);
    }
    getDevices();
    requestCameraPermission();
  }, []);

  const selectDeviceId = useWatch({ 
    name: "deviceId", 
    control 
  });

  const isMirror = useWatch({ 
    name: "isMirror", 
    control 
  });

  useEffect(() => {
    if (!videoRef.current) return;
    const videoElement = videoRef.current;
    let frid: number;
    async function play() {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectDeviceId } },
        });
      } catch (error: any) {
        if (error.name === "OverconstrainedError") {
          const defaultDeviceId = devices.find((device) => device.kind === "videoinput")?.deviceId;
          setValue("deviceId", defaultDeviceId || ""); // 使用 setValue 更新表单
        }
      }
      if (mediaStream) {
        videoElement.srcObject = mediaStream;
        videoElement.onloadeddata = () => {
          async function processFrame() {
            // if (tf) {
            //   const tensor = await tf.browser.fromPixelsAsync(videoElement, 4);
            //   if (data?.isMirrored) {
            //     const mirroredTensor = tf.reverse(tensor, [1]);
            //     setRuntimeNodeData({ tensor: mirroredTensor });
            //     tensor.dispose();
            //   } else {
            //     setRuntimeNodeData({ tensor });
            //   }
            //   frid = requestAnimationFrame(processFrame);
            // }
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
        tracks.forEach((track) => track.stop());
      }
      videoElement.srcObject = null;
    };
  }, [openPreview, isMirror, selectDeviceId, devices, setValue, data, videoRef]);

  return (
    <div className="mt-2">
      <div className="px-4 pb-2 space-y-4">
        <form>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="my-2 flex items-center justify-between text-sm font-medium text-gray-900"
            >
              设备
            </label>
            <div className="mt-1">
              <Select
                className="w-full"
                onSelect={(i) => {
                  setValue("deviceId", i.value as string);
                }}
                // {...register("deviceId")}
                items={(devices || []).map((item) => ({
                  name: item.label,
                  value: item.deviceId,
                }))}
                allowSearch={false}
                bgClassName="bg-gray-50"
              />
            </div>
          </div>
          <div className="mb-5">
            <label
              htmlFor="isMirrored"
              className="my-2 flex items-center justify-between text-sm font-medium text-gray-900"
            >
              镜像
            </label>
            <div className="mt-1">
              <Switch 
                defaultValue={false}
                onChange={(value) => setValue("isMirror", value)}
              />
            </div>
          </div>
        </form>
        <div className="mb-5">
          <label
            htmlFor="isMirrored"
            className="my-2 flex items-center justify-between text-sm font-medium text-gray-900"
          >
            打开预览
          </label>
          <div className="mt-1">
            <Switch
              defaultValue={openPreview}
              onChange={(value) => setOpenPreview(value)}
            />
          </div>
          {openPreview && (
            <div className="mt-2">
              <video
                ref={videoRef}
                style={{ width: "100%", height: "auto", transform: isMirror ? 'scaleX(-1)' : 'scaleX(1)' }}
              ></video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Panel);
