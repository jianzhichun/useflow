import { BlockEnum } from "@/app/components/workflow/types";
import { Position } from "reactflow";

export const workflowInitData: any = {
  id: "6fb57a21-48e0-4a82-ae9e-df683fd8e341",
  graph: {
    nodes: [
      {
        id: "1724168608787",
        type: "custom",
        data: {
          type: BlockEnum.Start,
          title: "开始",
          desc: "",
          variables: [],
          selected: true
        },
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        width: 244,
        height: 54,
      },
    ],
    edges: [],
    viewport: {
      x: -16,
      y: 233,
      zoom: 1,
    },
  },
  features: {
    opening_statement: "",
    suggested_questions: [],
    suggested_questions_after_answer: {
      enabled: false,
    },
    text_to_speech: {
      enabled: false,
      voice: "",
      language: "",
    },
    speech_to_text: {
      enabled: false,
    },
    retriever_resource: {
      enabled: true,
    },
    sensitive_word_avoidance: {
      enabled: false,
    },
    file_upload: {
      image: {
        enabled: false,
        number_limits: 3,
        transfer_methods: ["local_file", "remote_url"],
      },
    },
  },
  hash: "5bf286b544c9f40a6cd87a2f55946426932b7df8b2676c81c859dd71ad35de19",
  created_by: {
    id: "b3cd70d4-5dda-4b8d-9db0-4122e40fdcff",
    name: "Rivery",
    email: "xigongdaericyang@gmail.com",
  },
  created_at: 1724168609,
  updated_by: {
    id: "b3cd70d4-5dda-4b8d-9db0-4122e40fdcff",
    name: "Rivery",
    email: "xigongdaericyang@gmail.com",
  },
  updated_at: 1724252254,
  tool_published: false,
  environment_variables: [],
};
