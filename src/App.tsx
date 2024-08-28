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
  Panel,
  useUpdateNodeInternals,
  Edge
} from '@xyflow/react';
import { Button, Flex, Switch, ConfigProvider, theme } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';
import ContextMenu from './components/ContextMenu';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Tensor } from '@tensorflow/tfjs-core';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';

interface RuntimeNodeState {
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
        for (
          let edge = edges.find(({ target, targetHandle }) => target === id_ && targetHandle === key_);
          edge?.sourceHandle;
          id_ = edge.source, key_ = edge.sourceHandle,
          edge = edges.find(({ target, targetHandle }) => target === id_ && targetHandle === key_)
        ) { }
        return state?.[id_]?.[key_];
      }

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
    set(id: string, nodeData: { [K: string]: Tensor | any }) {
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

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>();
  const [rfInstance, setRfInstance] = useState<any>(null);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const onConnect: OnConnect = useCallback(
    (connection) => {
      setEdges((edges) => addEdge(connection, edges));
      updateNodeInternals(connection.target);
    }, []
  );
  useEffect(() => {
    useRuntimeNodeStore.setState({ edges });
  }, [edges]);

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
  const onAddNode = useCallback(({ key: type, data }: any) => {
    if (menuPosition) {
      const newNode = {
        id: nanoid(), type, data,
        position: screenToFlowPosition({
          x: menuPosition.x,
          y: menuPosition.y,
        })
      };
      setNodes((nds) => nds.concat(newNode));
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
  useEffect(() => {

  ConfigProvider.config({
    holderRender: (children) => (
      <ConfigProvider
        theme={{ algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm] }}
      >
        {children}
      </ConfigProvider>
    ),
  });
  }, [isDark]);
  return (
    <>
      <ConfigProvider componentSize='small' theme={{ algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm] }}>
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
          colorMode={isDark ? 'dark' : 'light'}
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
          <Panel position="top-right">
            <Switch onChange={setIsDark} checked={isDark}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            >
            </Switch>
          </Panel>
        </ReactFlow>
        <ContextMenu position={menuPosition} onAddNode={onAddNode} nodeTypes={nodeTypes} />
      </ConfigProvider>
    </>
  );
}
