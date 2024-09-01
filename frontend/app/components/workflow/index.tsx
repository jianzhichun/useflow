"use client";
import type { FC } from "react";
import ReactFlow, {
  Background,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Viewport,
} from "reactflow";
import "reactflow/dist/style.css";
import "./style.css";
import type { Edge, Node } from "./types";
import { memo, useMemo, useRef } from "react";
import {
  useWorkflowInit,
  useNodesInteractions,
  usePanelInteractions,
} from "./hooks";
import { getKeyboardKeyCodeBySystem, initialEdges, initialNodes, isEventTargetInputArea } from "./utils";
import Loading from "@/app/components/base/loading";
import { useWorkflowHistoryStore, WorkflowHistoryProvider } from "./workflow-history-store";
import { WorkflowContextProvider } from "./context";
import { CUSTOM_NODE, WORKFLOW_DATA_UPDATE } from "./constants";
import CustomNode from "./nodes";
import CustomEdge from "./custom-edge";
import CustomConnectionLine from './custom-connection-line';
import PanelContextmenu from "./panel-contextmenu";
import CandidateNode from "./candidate-node";
import { useEventEmitterContextContext } from "@/context/event-emitter";
import Panel from "./panel";
import { useWorkflowUpdate } from "./hooks/use-workflow-interactions";
import { useEventListener, useKeyPress } from "ahooks";
import { useWorkflowStore } from "./store";
import { useEdgesInteractions } from "./hooks/use-edges-interactions";

type WorkflowProps = {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
};

const nodeTypes = {
  [CUSTOM_NODE]: CustomNode,
};

const edgeTypes = {
  [CUSTOM_NODE]: CustomEdge,
};

const Workflow: FC<WorkflowProps> = memo(
  ({ nodes: originalNodes, edges: originalEdges, viewport }) => {
    const workflowContainerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useNodesState(originalNodes);
    const [edges, setEdges] = useEdgesState(originalEdges);
    const reactflow = useReactFlow();
    const { eventEmitter } = useEventEmitterContextContext();
    const workflowStore = useWorkflowStore();

    eventEmitter?.useSubscription((v: any) => {
      if (v.type === WORKFLOW_DATA_UPDATE) {
        setNodes(v.payload.nodes);
        setEdges(v.payload.edges);

        if (v.payload.viewport) {
          reactflow.setViewport(v.payload.viewport);
        }
      }
    });

    useEventListener("keydown", (e) => {
      if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey))
        e.preventDefault();
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey))
        e.preventDefault();
      if ((e.key === "y" || e.key === "Y") && (e.ctrlKey || e.metaKey))
        e.preventDefault();
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey))
        e.preventDefault();
    });
    
    useEventListener("mousemove", (e) => {
      const containerClientRect =
        workflowContainerRef.current?.getBoundingClientRect();
      if (containerClientRect) {
        workflowStore.setState({
          mousePosition: {
            pageX: e.clientX,
            pageY: e.clientY,
            elementX: e.clientX - containerClientRect.left,
            elementY: e.clientY - containerClientRect.top,
          },
        });
      }
    });

    const {
      handleNodeDragStart,
      handleNodeDrag,
      handleNodeDragStop,
      handleNodeEnter,
      handleNodeLeave,
      handleNodeClick,
      handleNodeConnect,
      handleNodeConnectStart,
      handleNodeConnectEnd,
      handleNodeContextMenu,
      handleNodesCopy,
      handleNodesPaste,
      handleNodesDuplicate,
      handleNodesDelete,
      handleHistoryBack,
      handleHistoryForward,
    } = useNodesInteractions();

    const {
      handleEdgeEnter,
      handleEdgeLeave,
      handleEdgeDelete,
      handleEdgesChange,
    } = useEdgesInteractions()

    const {
      handlePaneContextMenu,
      // handlePaneContextmenuCancel,
    } = usePanelInteractions();

    useKeyPress(["delete", "backspace"], (e) => {
      if (isEventTargetInputArea(e.target as HTMLElement)) return;
      handleNodesDelete();
    });

    useKeyPress(['delete', 'backspace'], handleEdgeDelete)
    useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.c`, (e) => {
      if (isEventTargetInputArea(e.target as HTMLElement))
        return
  
      handleNodesCopy()
    }, { exactMatch: true, useCapture: true })
    useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.v`, (e) => {
      if (isEventTargetInputArea(e.target as HTMLElement))
        return
  
      handleNodesPaste()
    }, { exactMatch: true, useCapture: true })

    const { shortcutsEnabled: workflowHistoryShortcutsEnabled } = useWorkflowHistoryStore()

    useKeyPress(
      `${getKeyboardKeyCodeBySystem('ctrl')}.z`,
      () => workflowHistoryShortcutsEnabled && handleHistoryBack(),
      { exactMatch: true, useCapture: true },
    )
  
    useKeyPress(
      [`${getKeyboardKeyCodeBySystem('ctrl')}.y`, `${getKeyboardKeyCodeBySystem('ctrl')}.shift.z`],
      () => workflowHistoryShortcutsEnabled && handleHistoryForward(),
      { exactMatch: true, useCapture: true },
    )

    return (
      <div
        id="workflow-container"
        className={`
        relative w-full min-w-[960px] h-full bg-[#F0F2F7]
      `}
        ref={workflowContainerRef}
      >
        <CandidateNode />
        <Panel />
        <PanelContextmenu />
        <ReactFlow
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onNodeMouseEnter={handleNodeEnter}
          onNodeMouseLeave={handleNodeLeave}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onConnect={handleNodeConnect}
          onConnectStart={handleNodeConnectStart}
          onConnectEnd={handleNodeConnectEnd}
          onEdgeMouseEnter={handleEdgeEnter}
          onEdgeMouseLeave={handleEdgeLeave}
          onEdgesChange={handleEdgesChange}
          // onSelectionStart={handleSelectionStart}
          // onSelectionChange={handleSelectionChange}
          // onSelectionDrag={handleSelectionDrag}
          onPaneContextMenu={handlePaneContextMenu}
          connectionLineComponent={CustomConnectionLine}
          // connectionLineContainerStyle={{ zIndex: ITERATION_CHILDREN_Z_INDEX }}
          defaultViewport={viewport}
          multiSelectionKeyCode={null}
          deleteKeyCode={null}
          nodesDraggable
          nodesConnectable
          nodesFocusable
          edgesFocusable
          panOnDrag
          zoomOnPinch
          zoomOnScroll
          zoomOnDoubleClick
          selectionKeyCode={null}
          selectionMode={SelectionMode.Partial}
          selectionOnDrag
          minZoom={0.25}
        >
          <Background gap={[14, 14]} size={2} color="#E4E5E7" />
        </ReactFlow>
      </div>
    );
  }
);

Workflow.displayName = "Workflow";

const WorkflowWrap = memo(() => {
  const { data, isLoading } = useWorkflowInit();

  const nodesData = useMemo(() => {
    if (data) return initialNodes(data.graph.nodes, data.graph.edges);

    return [];
  }, [data]);
  const edgesData = useMemo(() => {
    if (data) return initialEdges(data.graph.edges, data.graph.nodes);

    return [];
  }, [data]);

  if (!data || isLoading) {
    return (
      <div className="flex justify-center items-center relative w-full h-full bg-[#F0F2F7]">
        <Loading />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <WorkflowHistoryProvider nodes={nodesData} edges={edgesData}>
        <Workflow
          nodes={nodesData}
          edges={edgesData}
          viewport={data?.graph.viewport}
        />
      </WorkflowHistoryProvider>
    </ReactFlowProvider>
  );
});
WorkflowWrap.displayName = "WorkflowWrap";

const WorkflowContainer = () => {
  return (
    <WorkflowContextProvider>
      <WorkflowWrap />
    </WorkflowContextProvider>
  );
};

export default memo(WorkflowContainer);
