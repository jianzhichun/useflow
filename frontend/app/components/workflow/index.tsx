"use client";
import type { FC } from "react";
import ReactFlow, {
  Background,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Viewport,
} from "reactflow";
import type { Edge, Node } from "./types";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkflowInit, useNodesInteractions } from "./hooks";
import { initialEdges, initialNodes } from "./utils";
import Loading from "@/app/components/base/loading";
import { WorkflowHistoryProvider } from "./workflow-history-store";
import { WorkflowContextProvider } from "./context";
import { CUSTOM_NODE } from "./constants";
import CustomNode from "./nodes";
import CustomEdge from "./custom-edge";

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
    } = useNodesInteractions()

    return (
      <div
        id="workflow-container"
        className={`
        relative w-full min-w-[960px] h-full bg-[#F0F2F7]
      `}
        ref={workflowContainerRef}
      >
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
          defaultViewport={viewport}
          multiSelectionKeyCode={null}
          deleteKeyCode={null}
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
