import { useCallback, useState, useEffect } from 'react';
import { Edge, Node } from '@xyflow/react';
import { Button, Input, Space, Menu, Popover, Flex, Popconfirm } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Tensor } from '@tensorflow/tfjs-core';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useDeepCompareEffect, useLocalStorageState } from 'ahooks';
import WithPermission, { } from './components/WithPermission';
import { isEqual } from 'lodash';
import EditableTitle from './components/EditableTitle';
import { UseFlow, useFlowHistory } from './flows/UseFlow';

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
      title: "",
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
        reset(flow);
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
            {flow.title || '未命名'}
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
