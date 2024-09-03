import { useCallback, useState, useEffect, useMemo } from 'react';
import { Edge, Node } from '@xyflow/react';
import { Button, Input, Space, Menu, Popover, Flex, Popconfirm, Progress, ConfigProvider, theme } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useDeepCompareEffect, useLocalStorageState } from 'ahooks';
import WithPermission, { } from './components/WithPermission';
import { isEqual, range } from 'lodash';
import EditableTitle from './components/EditableTitle';
import { UseFlow, useFlowHistory } from './flows/UseFlow';
import { orange as lightColors, geekblue as darkColors } from '@ant-design/colors';

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
  const [isDark, setIsDark] = useLocalStorageState<boolean>("isDark", { defaultValue: false });
  const [progress, setProgress] = useState();
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => <ConfigProvider
        theme={{ algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm] }}
      >{children}</ConfigProvider>,
    });
  }, [isDark]);
  useEffect(() => {
    if ((window as any).electron) {
      const { ipcRenderer } = (window as any).electron;
      ipcRenderer.on('update-progress', (_: any, { percent }: any) => setProgress(percent));
      return () => ipcRenderer.removeAllListeners('update-progress');
    }
  }, []);
  const steps = useMemo(() => Math.ceil(window.innerWidth / 4), [window.innerWidth]);
  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);
  return <WithPermission>
    <ConfigProvider componentSize='small' theme={{ algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm] }}>
      {!!progress && progress != 100 && <Progress
        size={'small'} style={{ display: 'flex' }} showInfo={false}
        percent={progress}
        steps={steps}
        strokeColor={range(0, steps).map(i => colors[Math.floor(i / Math.ceil(steps / colors.length))])}
      ></Progress>}
      <UseFlow titleRender={<TitleWithManagement
        title={title}
        flows={flows || []}
        currFlowId={currFlowId ?? ""}
        onChangeTitle={setTitle}
        onSelectFlow={changeCurrFlow}
        onDeleteFlow={deleteFlow}
        onCreateFlow={createFlow}
      />} {...currFlowHistory} isDark={isDark || false} setIsDark={setIsDark} />
    </ConfigProvider>
  </WithPermission>;
}
