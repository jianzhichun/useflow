import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  useReactFlow,
  Panel
} from '@xyflow/react';
import { Button, Flex } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import ContextMenu from './ContextMenu';
import { create } from 'zustand';

export const useRuntimeNodeDataStore = create((set) => {
  return {
    nodeDatas: {},
    edgeKV: {},
    getInputParam(id: any, key: any) {
      const state = this as any;
      if (state.edgeKV[`${id}---${key}`]) {
        const [id_, key_] = state.edgeKV[`${id}---${key}`].split('---');
        if (!state.nodeDatas?.[id_]?.[key_]) {
          return state.getInputParam(id_, key_);
        }
        return state.nodeDatas[id_][key_];
      }
    },
    setEdgeKV(source: string, target: string) {
      return set((state: any) => ({
        edgeKV: {
          ...state.edgeKV,
          [source]: target
        }
      }));
    },
    setNodeData(id: string, nodeData: any) {
      return set((state: any) => ({
        nodeDatas: {
          ...state.nodeDatas,
          [id]: { ...state.nodeDatas[id], ...nodeData }
        }
      }));
    }
  };
});

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>();
  const [rfInstance, setRfInstance] = useState<any>(null);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const setEdgeKV = useRuntimeNodeDataStore((state: any) => state.setEdgeKV);

  useEffect(() => {
    edges.forEach(connection => {
      if (connection.targetHandle && connection.sourceHandle) {
        setEdgeKV(`${connection.target}---${connection.targetHandle}`, `${connection.source}---${connection.sourceHandle}`);
      }
    });
  }, [nodes, edges]);
  const onConnect: OnConnect = useCallback((connection) => {
    setEdges((edges) => addEdge(connection, edges));
    if (connection.targetHandle && connection.sourceHandle) {
      setEdgeKV(`${connection.target}---${connection.targetHandle}`, `${connection.source}---${connection.sourceHandle}`);
    }
  }, [nodes]);
  const onContextMenu = useCallback((event: any) => {
    event.preventDefault();
    if (reactFlowWrapper?.current) {
      const reactFlowBounds = reactFlowWrapper?.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      setMenuPosition(position);
    }
  }, []);

  const onAddNode = useCallback((type: string) => {
    if (menuPosition) {
      const newNode = {
        id: nanoid(),
        type,
        position: screenToFlowPosition({
          x: menuPosition.x,
          y: menuPosition.y,
        }),
        data: { label: `${type} node` },
      };
      setNodes((nds) => nds.concat(newNode as any));
      setMenuPosition(null);
    }
  }, [menuPosition, screenToFlowPosition]);
  const onExport = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const json = JSON.stringify(flow, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'useflow.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [rfInstance]);
  const onImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        const data = JSON.parse(content);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);
  return (
    <>
      <ReactFlow
        ref={reactFlowWrapper}
        onContextMenu={onContextMenu}
        onClick={() => setMenuPosition(null)}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
        <Panel position="top-left">
          <Flex gap="small" wrap>
            <Button onClick={onImport}>导入</Button>
            <Button onClick={onExport}>导出</Button>
          </Flex>
        </Panel>
      </ReactFlow>
      <ContextMenu position={menuPosition} onAddNode={onAddNode} nodeTypes={nodeTypes} />
    </>
  );
}
