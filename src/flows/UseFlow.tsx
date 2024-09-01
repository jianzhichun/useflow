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
import { Button, Switch, ConfigProvider, theme, Modal, Space, Popover, Flex, Popconfirm, message } from 'antd';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import ContextMenu from '../components/ContextMenu';
import { ExportOutlined, ImportOutlined, MoonOutlined, RedoOutlined, RestOutlined, SaveOutlined, SunOutlined, UndoOutlined } from '@ant-design/icons';
import { useDebounce, useDeepCompareEffect, useKeyPress, useLocalStorageState } from 'ahooks';
import { usePermission, useResetLicense } from '../components/WithPermission';
import { decrypt, encrypt } from '../components/Utils';
import moment from 'moment';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';

type FlowState = {
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
    reset: (state: FlowState) => void;
    save: () => void;
    clear: () => void;
    canUndo: boolean;
    canRedo: boolean;
    canSave: boolean;
    canClear: boolean;
}
export function useFlowHistory(initialTitle: string, initialNodes: Node[], initialEdges: Edge[], historyCapacity: number = 50): UseFlowHistory {
    const { getNodes, getEdges } = useReactFlow();
    const historyRef = useRef<FlowState[]>([{ title: initialTitle, nodes: initialNodes, edges: initialEdges }]);
    const indexRef = useRef<number>(0);
    const ignoreNextEffectRef = useRef<boolean>(false);
    const [title, setTitle] = useState<string>(initialTitle);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [canUndo, setCanUndo] = useState<boolean>(false);
    const [canRedo, setCanRedo] = useState<boolean>(false);
    const canSave = useMemo(() => canUndo && !canRedo, [canUndo, canRedo]);
    const canClear = useMemo(() => !!(nodes.length || edges.length), [nodes?.length, edges?.length]);
    const currState = useMemo<FlowState>(() => ({ title, nodes, edges }), [title, nodes, edges]);
    const debouncedCurrState = useDebounce(currState, { wait: 200 });
    const updatePredicate = useCallback(() => {
        setCanUndo(indexRef.current > 0);
        setCanRedo(indexRef.current < historyRef.current.length - 1);
    }, []);
    const updateCurrState = useCallback(({ title, nodes, edges }: FlowState, ignoreNextEffect: boolean = true) => {
        ignoreNextEffectRef.current = ignoreNextEffect;
        setTitle(title);
        setNodes(nodes);
        setEdges(edges);
        updatePredicate();
    }, []);
    const undo = useCallback(() => {
        if (indexRef.current > 0) {
            indexRef.current -= 1;
            updateCurrState(historyRef.current[indexRef.current]);
        }
    }, []);
    const redo = useCallback(() => {
        if (indexRef.current < historyRef.current.length - 1) {
            indexRef.current += 1;
            updateCurrState(historyRef.current[indexRef.current]);
        }
    }, []);
    const reset = useCallback(({ title, nodes, edges }: FlowState) => {
        indexRef.current = 0;
        historyRef.current = [{ title, nodes, edges }];
        updateCurrState(historyRef.current[indexRef.current]);
    }, []);
    const save = useCallback(() => {
        ignoreNextEffectRef.current = true;
        const nodes = getNodes();
        console.log(nodes.map(n => n.data));
        setNodes(nodes);
        setEdges(getEdges());
    }, [getNodes, getEdges, title]);
    const clear = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, []);
    useDeepCompareEffect(() => {
        if (ignoreNextEffectRef.current) {
            ignoreNextEffectRef.current = false;
        } else {
            let newHistory = historyRef.current.slice(0, indexRef.current + 1);
            if (newHistory.length >= historyCapacity) {
                newHistory = newHistory.slice(newHistory.length - historyCapacity + 1);
                indexRef.current -= 1;
            }
            historyRef.current = [...newHistory, debouncedCurrState];
            indexRef.current = historyRef.current.length - 1;
            updatePredicate();
        }
    }, [debouncedCurrState, historyCapacity]);
    return { title, nodes, edges, setTitle, setNodes, setEdges, onNodesChange, onEdgesChange, undo, redo, reset, save, clear, canUndo, canRedo, canSave, canClear };
}
export function UseFlow({ titleRender, isDark, setIsDark, title, nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, undo, redo, save, clear, canUndo, canRedo, canClear }: UseFlowHistory & { titleRender: ReactNode } & { isDark: boolean, setIsDark: (dark: boolean) => void }) {
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>();
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const { screenToFlowPosition } = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const updateNodeInternals = useUpdateNodeInternals();
    const saveWithMessage = useCallback((e: any) => {
        e?.preventDefault();
        save();
        message.success({ content: '保存成功' });
    }, []);
    useKeyPress(['meta.z', 'ctrl.z'], undo, { exactMatch: true, useCapture: true });
    useKeyPress(['meta.shift.z', 'ctrl.shift.z'], redo, { exactMatch: true, useCapture: true });
    useKeyPress(['meta.s', 'ctrl.s'], saveWithMessage, { exactMatch: true, useCapture: true });
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
    const permission = usePermission("baseddl");
    const resetLicense = useResetLicense();
    return <>
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
                    <Button onClick={saveWithMessage} icon={<SaveOutlined />}>保存</Button>
                    <Button onClick={undo} disabled={!canUndo} icon={<UndoOutlined />}>撤回</Button>
                    <Button onClick={redo} disabled={!canRedo} icon={<RedoOutlined />}>重做</Button>
                    <Popconfirm title="确定清空吗？" okText="是" cancelText="否" onConfirm={clear}>
                        <Button disabled={!canClear} icon={<RestOutlined />}>清空</Button>
                    </Popconfirm>
                </Space>
            </Panel>
            <Panel position="top-right">
                <Space>
                    <Popover overlayInnerStyle={{ padding: 0 }} arrow={false} content={<Flex vertical>
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
        <ContextMenu position={menuPosition} onAddNode={onAddNode} nodeTypes={nodeTypes} />
    </>;
}