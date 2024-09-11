import type { FC } from "react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VideoRenderType } from "./types";
import type { InputVar, NodePanelProps } from "@/app/components/workflow/types";
import Select from "@/app/components/base/select";
import { requestCameraPermission } from "@/app/utils";

// const i18nPrefix = 'workflow.nodes.start'

const deviceFormSchema = z.object({
  device: z
    .string()
    .min(1, { message: "login.error.emailInValid" })
    .email("login.error.emailInValid"),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

const Panel: FC<NodePanelProps<VideoRenderType>> = ({ id, data }) => {
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: { device: "" },
  });

  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (error) {
        console.error('无法获取摄像头权限:', error);
        return;
      }
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);
    }
    getDevices();
    requestCameraPermission();
  }, []);

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
                  // onInputsChange({ ...inputs, [item.key]: i.value });
                }}
                // items={(item.options || []).map((i) => ({ name: i, value: i }))}
                allowSearch={false}
                bgClassName="bg-gray-50"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(Panel);
