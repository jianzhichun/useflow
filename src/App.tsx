import { useCallback, useState, useRef, useEffect, Dispatch, SetStateAction, ReactNode, useMemo } from 'react';
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
  Edge,
  Node,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange
} from '@xyflow/react';
import { Button, Switch, ConfigProvider, theme, Modal, Input, Space, Menu, Popover, Flex, Popconfirm } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import ContextMenu from './components/ContextMenu';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Tensor } from '@tensorflow/tfjs-core';
import { DeleteOutlined, ExportOutlined, ImportOutlined, MoonOutlined, PlusOutlined, RedoOutlined, RestOutlined, SunOutlined, UndoOutlined } from '@ant-design/icons';
import { useDebounceFn, useDeepCompareEffect, useKeyPress, useLocalStorageState } from 'ahooks';
import WithPermission, { usePermission, useResetLicense } from './components/WithPermission';
import { decrypt, encrypt } from './components/Utils';
import { isEqual } from 'lodash';
import EditableTitle from './components/EditableTitle';
import moment from 'moment';

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
type HistoryState = {
  title: string;
  nodes: Node[];
  edges: Edge[];
};
interface UseFlowHistory {
  title: string;
  nodes: Node[];
  edges: Edge[];
  setTitle: Dispatch<SetStateAction<string>>;
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  undo: () => void;
  redo: () => void;
  reset: (title: string, nodes: Node[], edges: Edge[]) => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
}
function useFlowHistory(initialTitle: string, initialNodes: Node[], initialEdges: Edge[], historyCapacity: number = 50): UseFlowHistory {
  const [title, setTitle] = useState<string>(initialTitle);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const historyRef = useRef<HistoryState[]>([{ title: initialTitle, nodes: initialNodes, edges: initialEdges }]);
  const indexRef = useRef<number>(0);
  const ignoreNextEffect = useRef<number>(0);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const setNodesAndEdges = useDebounceFn((newTitle: string, newNodes: Node[], newEdges: Edge[]) => {
    const history = historyRef.current;
    const currentState = { title: newTitle, nodes: newNodes, edges: newEdges };

    if (!isEqual(history[indexRef.current], currentState)) {
      let newHistory = history.slice(0, indexRef.current + 1);
      if (newHistory.length >= historyCapacity) {
        newHistory = newHistory.slice(newHistory.length - historyCapacity + 1);
        indexRef.current -= 1;
      }
      newHistory.push(currentState);
      historyRef.current = newHistory;
      indexRef.current = newHistory.length - 1;
      updateUndoRedoState();
    }
  }, { wait: 200 }).run;

  useDeepCompareEffect(() => {
    if (ignoreNextEffect.current) {
      ignoreNextEffect.current -= 1;
    } else {
      const latestState = historyRef.current[indexRef.current];
      if (!isEqual(title, latestState.title) || !isEqual(nodes, latestState.nodes) || !isEqual(edges, latestState.edges)) {
        setNodesAndEdges(title, nodes, edges);
      }
    }
  }, [title, nodes, edges]);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      const { title, nodes, edges } = historyRef.current[indexRef.current];
      ignoreNextEffect.current = 1;
      setTitle(title);
      setNodes(nodes);
      setEdges(edges);
      updateUndoRedoState();
    }
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      const { title, nodes, edges } = historyRef.current[indexRef.current];
      ignoreNextEffect.current = 1;
      setTitle(title);
      setNodes(nodes);
      setEdges(edges);
      updateUndoRedoState();
    }
  }, [setNodes, setEdges]);

  const reset = useCallback((newTitle: string, newNodes: Node[], newEdges: Edge[]) => {
    historyRef.current = [{ title: newTitle, nodes: newNodes, edges: newEdges }];
    indexRef.current = 0;
    ignoreNextEffect.current = 1;
    setTitle(newTitle);
    setNodes(newNodes);
    setEdges(newEdges);
    updateUndoRedoState();
  }, [setNodes, setEdges]);

  const clear = useCallback(() => {
    ignoreNextEffect.current = 2;
    setNodes([]);
    setEdges([]);
    setNodesAndEdges(title, [], []);
  }, [title, setNodesAndEdges, setNodes, setEdges]);
  const canClear = useMemo(() => !!(nodes.length || edges.length), [nodes?.length, edges?.length]);
  return { title, nodes, edges, setTitle, setNodes, setEdges, onNodesChange, onEdgesChange, undo, redo, reset, clear, canUndo, canRedo, canClear };
}
function UseFlow({ titleRender, title, nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, undo, redo, clear, canUndo, canRedo, canClear }: UseFlowHistory & { titleRender: ReactNode }) {
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>();
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  useKeyPress(['meta.z', 'ctrl.z'], undo, { exactMatch: true, useCapture: true });
  useKeyPress(['meta.shift.z', 'ctrl.shift.z'], redo, { exactMatch: true, useCapture: true });
  useEffect(() => useRuntimeNodeStore.setState({ edges }), [edges]);
  const onConnect: OnConnect = useCallback((connection) => {
    setEdges((edges) => addEdge(connection, edges));
    updateNodeInternals(connection.target);
  }, []);
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
  const onAddNode = useCallback(({ key: type, getData }: any) => {
    if (menuPosition) {
      const newNode = {
        id: nanoid(), type, data: getData(),
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
      const json = JSON.stringify(flow);
      const blob = new Blob([encrypt(json)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.useflow`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [rfInstance, title]);
  const onImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.useflow';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.name.endsWith('.useflow')) {
        Modal.error({ content: "只支持.useflow格式" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        const data = JSON.parse(decrypt(content));
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);
  const onImportDemo = useCallback((filename: string) => {
    Modal.confirm({
      title: '导入演示',
      content: '导入演示数据会覆盖当前数据，是否继续？',
      onOk() {
        fetch(`./demo/${filename}`)
          .then(response => response.text())
          .then(content => {
            const data = JSON.parse(decrypt(content));
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
          })
          .catch(error => console.error('Error loading the file:', error));
      },
      okText: '是',
      cancelText: '否'
    });
  }, []);
  const [isDark, setIsDark] = useLocalStorageState<boolean>("isDark");
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
  const permission = usePermission("baseddl");
  const resetLicense = useResetLicense();
  return <ConfigProvider componentSize='small' theme={{ algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm] }}>
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
        <Space>
          {titleRender}
          <Button onClick={onImport} icon={<ImportOutlined />}>导入</Button>
          <Button onClick={onExport} icon={<ExportOutlined />}>导出</Button>
          <Button onClick={undo} disabled={!canUndo} icon={<UndoOutlined />}>撤回</Button>
          <Button onClick={redo} disabled={!canRedo} icon={<RedoOutlined />}>重做</Button>
          <Popconfirm title="确定清空吗？" okText="是" cancelText="否" onConfirm={clear}>
            <Button disabled={!canClear} icon={<RestOutlined />}>清空</Button>
          </Popconfirm>
        </Space>
      </Panel>
      <Panel position="top-right">
        <Space>
          <Popover content={<Flex vertical>
            <Button type='dashed' onClick={() => onImportDemo("taichi.useflow")}>太极拳</Button>
          </Flex>}>
            <Button type='dashed'>导入案例</Button>
          </Popover>
          <Button type='dashed' onClick={resetLicense}>重置序列号</Button>
          <Switch onChange={setIsDark} checked={isDark}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          >
          </Switch>
        </Space>
      </Panel>
      <Panel position='bottom-right'>
        {permission?.value && moment(permission.value).format('yyyy-MM-DD HH:mm')}到期
      </Panel>
    </ReactFlow>
    <ContextMenu position={menuPosition} onAddNode={onAddNode} nodeTypes={nodeTypes} />;
  </ConfigProvider>;
}
type FlowState = {
  id: string;
  title: string;
  createdAt: number;
  modifiedAt?: number;
  nodes: Node[];
  edges: Edge[];
};
function useMultipleFlows() {
  const [flows, setFlows] = useLocalStorageState<FlowState[]>("flows", { defaultValue: [] });
  const [selectedFlowId, setSelectedFlowId] = useLocalStorageState<string>("selectedFlowId");
  const currFlowHistory = useFlowHistory("", [], []);
  const { title, nodes, edges, reset } = currFlowHistory;
  const createFlow = useCallback(() => {
    const newFlow = {
      id: nanoid(),
      title: "未命名",
      createdAt: Date.now(),
      nodes: [],
      edges: []
    };
    setFlows(flows => [newFlow, ...(flows || [])]);
    setSelectedFlowId(newFlow.id);
  }, []);
  const deleteFlow = useCallback((id: string) => {
    setFlows(flows => flows?.filter(flow => flow.id !== id) || []);
  }, [selectedFlowId]);
  useEffect(() => {
    if (flows?.length === 0) {
      createFlow();
    }
  }, [flows]);
  useEffect(() => {
    if (flows?.every(flow => flow.id !== selectedFlowId)) {
      setSelectedFlowId(flows?.[0]?.id);
    }
  }, [flows, selectedFlowId]);
  useDeepCompareEffect(() => setFlows(flows => flows?.map(flow => {
    if (flow.id === selectedFlowId) {
      if (!isEqual(flow.title, title) || !isEqual(flow.nodes, nodes) || !isEqual(flow.edges, edges)) {
        return { ...flow, title, nodes, edges, modifiedAt: Date.now() };
      }
    }
    return flow;
  }) || []), [title, nodes, edges]);
  useEffect(() => {
    if (selectedFlowId) {
      const flow = flows?.find(flow => flow.id === selectedFlowId);
      if (flow) {
        reset(flow.title, flow.nodes, flow.edges);
      }
    }
  }, [selectedFlowId]);
  return {
    flows: flows?.map(({ id, title, createdAt, modifiedAt }) => ({ id, title, createdAt, modifiedAt })),
    currFlowId: selectedFlowId,
    changeCurrFlow: setSelectedFlowId,
    createFlow,
    deleteFlow,
    currFlowHistory
  };
}
type Flow = {
  id: string;
  title: string;
  createdAt: number;
  modifiedAt?: number;
};

interface TitleWithManagementProps {
  title: string;
  flows: Flow[];
  currFlowId: string,
  onChangeTitle: (title: string) => void;
  onSelectFlow: (id: string) => void;
  onDeleteFlow: (id: string) => void;
  onCreateFlow: () => void;
}

const TitleWithManagement: React.FC<TitleWithManagementProps> = ({
  title,
  flows,
  currFlowId,
  onChangeTitle,
  onSelectFlow,
  onDeleteFlow,
  onCreateFlow,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const filteredFlows = flows.filter(flow => flow.title.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt));
  const menu = (<>
    <Space>
      <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <Button type='dashed' icon={<PlusOutlined />} onClick={onCreateFlow} />
    </Space>
    <Menu selectedKeys={[currFlowId]} style={{ maxHeight: '300px', overflow: 'scroll' }} mode='vertical' >
      {filteredFlows.map(flow => (
        <Menu.Item key={flow.id} onClick={() => onSelectFlow(flow.id)}>
          <Flex justify='space-between'>
            {flow.title}
            <Popconfirm title="确定删除吗？" okText="是" cancelText="否" onConfirm={() => onDeleteFlow(flow.id)}>
              <DeleteOutlined style={{ float: 'right' }} />
            </Popconfirm>
          </Flex>
        </Menu.Item>
      ))}
    </Menu>
  </>);
  return <Popover overlayInnerStyle={{ padding: 0 }} arrow={false} content={menu} placement="bottomLeft">
    <span style={{ marginRight: '10px' }}>
      <EditableTitle className='title-with-manager' title={title} onChange={onChangeTitle} />
    </span>
  </Popover>;
};
export default function App() {
  const { flows, currFlowId, changeCurrFlow, createFlow, deleteFlow, currFlowHistory, currFlowHistory: { title, setTitle } } = useMultipleFlows();
  return <WithPermission>
    <UseFlow titleRender={<TitleWithManagement
      title={title}
      flows={flows || []}
      currFlowId={currFlowId ?? ""}
      onChangeTitle={setTitle}
      onSelectFlow={changeCurrFlow}
      onDeleteFlow={deleteFlow}
      onCreateFlow={createFlow}
    />} {...currFlowHistory} />
  </WithPermission>;
}
