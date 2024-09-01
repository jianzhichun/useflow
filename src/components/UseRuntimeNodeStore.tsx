import { Tensor } from "@tensorflow/tfjs-core";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Edge } from '@xyflow/react';


export interface RuntimeNodeState {
  edges: Edge[],
  [id: string]: { [K: string]: Tensor | any },
  get: (id: string, key?: string) => any,
  set: (id: string, nodeData: { [K: string]: Tensor | any }) => void
}
export const useRuntimeNodeStore = create<RuntimeNodeState>()(subscribeWithSelector((setState, getState) => {
  return {
    edges: [],
    get(id: string, key?: string) {
      const state = getState();
      const edges = state.edges;
      const getOne = (id: string, key: string) => {
        let id_ = id, key_ = key;
        for (let edge = edges.find(({ target, targetHandle }) => target === id_ && targetHandle === key_); edge?.sourceHandle; id_ = edge.source, key_ = edge.sourceHandle,
          edge = edges.find(({ target, targetHandle }) => target === id_ && targetHandle === key_)) { }
        return state?.[id_]?.[key_];
      };

      if (!key) {
        return edges.filter(({ target }) => target === id).reduce((params, edge) => {
          if (edge.targetHandle) {
            return { ...params, [edge.targetHandle]: getOne(id, edge.targetHandle) };
          } else {
            return params;
          }
        }, {});
      }
      return getOne(id, key);
    },
    set(id: string, nodeData: { [K: string]: Tensor | any; }) {
      setState(state => {
        const currentData = state[id] || {};
        Object.keys(nodeData).forEach(key => {
          const prevValue = currentData[key];
          if (prevValue instanceof Tensor) {
            prevValue.dispose();
          }
        });
        return { [id]: { ...currentData, ...nodeData } };
      });
    }
  };
}));
