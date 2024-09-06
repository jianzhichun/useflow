import type { MouseEvent } from "react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import produce from "immer";
import type {
  NodeDragHandler,
  NodeMouseHandler,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  ResizeParamsWithDirection,
} from "reactflow";
import {
  getConnectedEdges,
  getOutgoers,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import type { Edge, Node } from "../types";
import { BlockEnum } from "../types";
import { useWorkflowStore } from "../store";
import {
  ITERATION_CHILDREN_Z_INDEX,
  ITERATION_PADDING,
  NODE_WIDTH_X_OFFSET,
  NODES_INITIAL_DATA,
  X_OFFSET,
  Y_OFFSET,
} from "../constants";
import {
  WorkflowHistoryEvent,
  useWorkflowHistory,
} from "./use-workflow-history";
import {
  generateNewNode,
  getNodesConnectedSourceOrTargetHandleIdsMap,
} from "../utils";
import { useWorkflow } from "./use-workflow";
import { OnNodeAdd } from "@/types/workflow";

export const useNodesInteractions = () => {
  const { t } = useTranslation();
  const store = useStoreApi();
  const workflowStore = useWorkflowStore();
  const reactflow = useReactFlow();
  const dragNodeStartPosition = useRef({ x: 0, y: 0 } as {
    x: number;
    y: number;
  });

  const { getAfterNodesInSameBranch } = useWorkflow();

  const { saveStateToHistory, undo, redo } = useWorkflowHistory();

  const handleNodeDragStart = useCallback<NodeDragHandler>((_, node) => {
    // workflowStore.setState({ nodeAnimation: false });
    dragNodeStartPosition.current = { x: node.position.x, y: node.position.y };
  }, []);

  const handleNodeDrag = useCallback<NodeDragHandler>((e, node: Node) => {
    const { getNodes, setNodes } = store.getState();
    e.stopPropagation();

    const nodes = getNodes();

    const newNodes = produce(nodes, (draft) => {
      const currentNode = draft.find((n) => n.id === node.id)!;
      currentNode.position.x = node.position.x;
      currentNode.position.y = node.position.y;
    });

    setNodes(newNodes);
  }, []);

  const handleNodeDragStop = useCallback<NodeDragHandler>((_, node) => {}, []);

  const handleNodeEnter = useCallback<NodeMouseHandler>((_, node) => {}, []);

  const handleNodeLeave = useCallback<NodeMouseHandler>((_, node) => {}, []);

  const handleNodeSelect = useCallback(
    (nodeId: string, cancelSelection?: boolean) => {
      const { getNodes, setNodes, edges, setEdges } = store.getState();

      const nodes = getNodes();
      const selectedNode = nodes.find((node) => node.data.selected);

      if (!cancelSelection && selectedNode?.id === nodeId) return;

      const newNodes = produce(nodes, (draft) => {
        draft.forEach((node) => {
          if (node.id === nodeId) node.data.selected = !cancelSelection;
          else node.data.selected = false;
        });
      });
      setNodes(newNodes);

      const connectedEdges = getConnectedEdges(
        [{ id: nodeId } as Node],
        edges
      ).map((edge) => edge.id);
      const newEdges = produce(edges, (draft) => {
        draft.forEach((edge) => {
          if (connectedEdges.includes(edge.id)) {
            edge.data = {
              ...edge.data,
              _connectedNodeIsSelected: !cancelSelection,
            };
          } else {
            edge.data = {
              ...edge.data,
              _connectedNodeIsSelected: false,
            };
          }
        });
      });
      setEdges(newEdges);
    },
    [store]
  );

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      handleNodeSelect(node.id);
    },
    [handleNodeSelect]
  );

  const handleNodeConnect = useCallback<OnConnect>(
    ({ source, sourceHandle, target, targetHandle }) => {
      if (source === target) return;
      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const nodes = getNodes();
      const targetNode = nodes.find((node) => node.id === target!);
      const sourceNode = nodes.find((node) => node.id === source!);

      if (targetNode?.parentId !== sourceNode?.parentId) return;

      const needDeleteEdges = edges.filter((edge) => {
        if (
          (edge.source === source && edge.sourceHandle === sourceHandle) ||
          (edge.target === target && edge.targetHandle === targetHandle)
        )
          return true;

        return false;
      });
      const needDeleteEdgesIds = needDeleteEdges.map((edge) => edge.id);
      const newEdge = {
        id: `${source}-${sourceHandle}-${target}-${targetHandle}`,
        type: "custom",
        source: source!,
        target: target!,
        sourceHandle,
        targetHandle,
        data: {
          sourceType: nodes.find((node) => node.id === source)!.data.type,
          targetType: nodes.find((node) => node.id === target)!.data.type,
          isInIteration: !!targetNode?.parentId,
          iteration_id: targetNode?.parentId,
        },
        zIndex: targetNode?.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
      };
      const nodesConnectedSourceOrTargetHandleIdsMap =
        getNodesConnectedSourceOrTargetHandleIdsMap(
          [
            ...needDeleteEdges.map((edge) => ({ type: "remove", edge })),
            { type: "add", edge: newEdge },
          ],
          nodes
        );
      const newNodes = produce(nodes, (draft: Node[]) => {
        draft.forEach((node) => {
          if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
            node.data = {
              ...node.data,
              ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
            };
          }
        });
      });
      setNodes(newNodes);
      const newEdges = produce(edges, (draft) => {
        const filtered = draft.filter(
          (edge) => !needDeleteEdgesIds.includes(edge.id)
        );

        filtered.push(newEdge);

        return filtered;
      });
      setEdges(newEdges);

      // handleSyncWorkflowDraft()
      saveStateToHistory(WorkflowHistoryEvent.NodeConnect);
    },
    []
  );

  const handleNodeConnectStart = useCallback<OnConnectStart>(
    (_, { nodeId, handleType, handleId }) => {},
    []
  );

  const handleNodeConnectEnd = useCallback<OnConnectEnd>((e: any) => {}, []);

  const handleNodeDelete = useCallback((nodeId: string) => {}, []);

  const handleNodeAdd = useCallback<OnNodeAdd>(
    (
      {
        nodeType,
        sourceHandle = "source",
        targetHandle = "target",
        toolDefaultValue,
      },
      { prevNodeId, prevNodeSourceHandle, nextNodeId, nextNodeTargetHandle }
    ) => {
      // if (getNodesReadOnly()) return;

      const { getNodes, setNodes, edges, setEdges } = store.getState();
      const nodes = getNodes();
      const nodesWithSameType = nodes.filter(
        (node) => node.data.type === nodeType
      );
      const newNode = generateNewNode({
        data: {
          ...NODES_INITIAL_DATA[nodeType],
          title:
            nodesWithSameType.length > 0
              ? `${t(`workflow.blocks.${nodeType}`)} ${
                  nodesWithSameType.length + 1
                }`
              : t(`workflow.blocks.${nodeType}`),
          ...(toolDefaultValue || {}),
          selected: true,
          _showAddVariablePopup: !!prevNodeId,
          _holdAddVariablePopup: false,
        },
        position: {
          x: 0,
          y: 0,
        },
      });
      if (prevNodeId && !nextNodeId) {
        const prevNodeIndex = nodes.findIndex((node) => node.id === prevNodeId);
        const prevNode = nodes[prevNodeIndex];
        const outgoers = getOutgoers(prevNode, nodes, edges).sort(
          (a, b) => a.position.y - b.position.y
        );
        const lastOutgoer = outgoers[outgoers.length - 1];

        newNode.data._connectedTargetHandleIds = [targetHandle];
        newNode.data._connectedSourceHandleIds = [];
        newNode.position = {
          x: lastOutgoer
            ? lastOutgoer.position.x
            : prevNode.position.x + prevNode.width! + X_OFFSET,
          y: lastOutgoer
            ? lastOutgoer.position.y + lastOutgoer.height! + Y_OFFSET
            : prevNode.position.y,
        };
        newNode.parentId = prevNode.parentId;
        newNode.extent = prevNode.extent;
        if (prevNode.parentId) {
          newNode.data.isInIteration = true;
          newNode.data.iteration_id = prevNode.parentId;
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }

        const newEdge: Edge = {
          id: `${prevNodeId}-${prevNodeSourceHandle}-${newNode.id}-${targetHandle}`,
          type: "custom",
          source: prevNodeId,
          sourceHandle: prevNodeSourceHandle,
          target: newNode.id,
          targetHandle,
          data: {
            sourceType: prevNode.data.type,
            targetType: newNode.data.type,
            isInIteration: !!prevNode.parentId,
            iteration_id: prevNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: prevNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };
        const nodesConnectedSourceOrTargetHandleIdsMap =
          getNodesConnectedSourceOrTargetHandleIdsMap(
            [{ type: "add", edge: newEdge }],
            nodes
          );
        const newNodes = produce(nodes, (draft: Node[]) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }

            if (prevNode.parentId === node.id)
              node.data._children?.push(newNode.id);
          });
          draft.push(newNode);
        });
        setNodes(newNodes);
        const newEdges = produce(edges, (draft) => {
          draft.forEach((item) => {
            item.data = {
              ...item.data,
              _connectedNodeIsSelected: false,
            };
          });
          draft.push(newEdge);
        });
        setEdges(newEdges);
      }
      if (!prevNodeId && nextNodeId) {
        const nextNodeIndex = nodes.findIndex((node) => node.id === nextNodeId);
        const nextNode = nodes[nextNodeIndex]!;
        newNode.data._connectedSourceHandleIds = [sourceHandle];
        newNode.data._connectedTargetHandleIds = [];
        newNode.position = {
          x: nextNode.position.x,
          y: nextNode.position.y,
        };
        newNode.parentId = nextNode.parentId;
        newNode.extent = nextNode.extent;
        if (nextNode.parentId) {
          newNode.data.isInIteration = true;
          newNode.data.iteration_id = nextNode.parentId;
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }
        if (nextNode.data.isIterationStart)
          newNode.data.isIterationStart = true;

        let newEdge;

        newEdge = {
          id: `${newNode.id}-${sourceHandle}-${nextNodeId}-${nextNodeTargetHandle}`,
          type: "custom",
          source: newNode.id,
          sourceHandle,
          target: nextNodeId,
          targetHandle: nextNodeTargetHandle,
          data: {
            sourceType: newNode.data.type,
            targetType: nextNode.data.type,
            isInIteration: !!nextNode.parentId,
            iteration_id: nextNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: nextNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };

        let nodesConnectedSourceOrTargetHandleIdsMap: Record<string, any>;
        if (newEdge) {
          nodesConnectedSourceOrTargetHandleIdsMap =
            getNodesConnectedSourceOrTargetHandleIdsMap(
              [{ type: "add", edge: newEdge }],
              nodes
            );
        }

        const afterNodesInSameBranch = getAfterNodesInSameBranch(nextNodeId!);
        const afterNodesInSameBranchIds = afterNodesInSameBranch.map(
          (node) => node.id
        );
        const newNodes = produce(nodes, (draft) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (afterNodesInSameBranchIds.includes(node.id))
              node.position.x += NODE_WIDTH_X_OFFSET;

            if (nodesConnectedSourceOrTargetHandleIdsMap?.[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }

            if (nextNode.parentId === node.id)
              node.data._children?.push(newNode.id);

            if (node.data.start_node_id === nextNodeId) {
              node.data.start_node_id = newNode.id;
              node.data.startNodeType = newNode.data.type;
            }

            if (node.id === nextNodeId && node.data.isIterationStart)
              node.data.isIterationStart = false;
          });
          draft.push(newNode);
        });
        setNodes(newNodes);
        if (newEdge) {
          const newEdges = produce(edges, (draft) => {
            draft.forEach((item) => {
              item.data = {
                ...item.data,
                _connectedNodeIsSelected: false,
              };
            });
            draft.push(newEdge);
          });
          setEdges(newEdges);
        }
      }
      if (prevNodeId && nextNodeId) {
        const prevNode = nodes.find((node) => node.id === prevNodeId)!;
        const nextNode = nodes.find((node) => node.id === nextNodeId)!;

        newNode.data._connectedTargetHandleIds = [targetHandle];
        newNode.data._connectedSourceHandleIds = [sourceHandle];
        newNode.position = {
          x: nextNode.position.x,
          y: nextNode.position.y,
        };
        newNode.parentId = prevNode.parentId;
        newNode.extent = prevNode.extent;
        if (prevNode.parentId) {
          newNode.data.isInIteration = true;
          newNode.data.iteration_id = prevNode.parentId;
          newNode.zIndex = ITERATION_CHILDREN_Z_INDEX;
        }

        const currentEdgeIndex = edges.findIndex(
          (edge) => edge.source === prevNodeId && edge.target === nextNodeId
        );
        const newPrevEdge = {
          id: `${prevNodeId}-${prevNodeSourceHandle}-${newNode.id}-${targetHandle}`,
          type: "custom",
          source: prevNodeId,
          sourceHandle: prevNodeSourceHandle,
          target: newNode.id,
          targetHandle,
          data: {
            sourceType: prevNode.data.type,
            targetType: newNode.data.type,
            isInIteration: !!prevNode.parentId,
            iteration_id: prevNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: prevNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };
        let newNextEdge: Edge | null = null;
        newNextEdge = {
          id: `${newNode.id}-${sourceHandle}-${nextNodeId}-${nextNodeTargetHandle}`,
          type: "custom",
          source: newNode.id,
          sourceHandle,
          target: nextNodeId,
          targetHandle: nextNodeTargetHandle,
          data: {
            sourceType: newNode.data.type,
            targetType: nextNode.data.type,
            isInIteration: !!nextNode.parentId,
            iteration_id: nextNode.parentId,
            _connectedNodeIsSelected: true,
          },
          zIndex: nextNode.parentId ? ITERATION_CHILDREN_Z_INDEX : 0,
        };
        const nodesConnectedSourceOrTargetHandleIdsMap =
          getNodesConnectedSourceOrTargetHandleIdsMap(
            [
              { type: "remove", edge: edges[currentEdgeIndex] },
              { type: "add", edge: newPrevEdge },
              ...(newNextEdge ? [{ type: "add", edge: newNextEdge }] : []),
            ],
            [...nodes, newNode]
          );

        const afterNodesInSameBranch = getAfterNodesInSameBranch(nextNodeId!);
        const afterNodesInSameBranchIds = afterNodesInSameBranch.map(
          (node) => node.id
        );
        const newNodes = produce(nodes, (draft) => {
          draft.forEach((node) => {
            node.data.selected = false;

            if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
              node.data = {
                ...node.data,
                ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
              };
            }
            if (afterNodesInSameBranchIds.includes(node.id))
              node.position.x += NODE_WIDTH_X_OFFSET;

            if (prevNode.parentId === node.id)
              node.data._children?.push(newNode.id);
          });
          draft.push(newNode);
        });
        setNodes(newNodes);
        const newEdges = produce(edges, (draft) => {
          draft.splice(currentEdgeIndex, 1);
          draft.forEach((item) => {
            item.data = {
              ...item.data,
              _connectedNodeIsSelected: false,
            };
          });
          draft.push(newPrevEdge);

          if (newNextEdge) draft.push(newNextEdge);
        });
        setEdges(newEdges);
      }
      saveStateToHistory(WorkflowHistoryEvent.NodeAdd);
    },
    [store, t, saveStateToHistory, workflowStore]
  );

  const handleNodeChange = useCallback(
    (currentNodeId: string, nodeType: BlockEnum, sourceHandle: string) => {},
    []
  );

  const handleNodeCancelRunningStatus = useCallback(() => {
    const { getNodes, setNodes } = store.getState();

    const nodes = getNodes();
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data._runningStatus = undefined;
      });
    });
    setNodes(newNodes);
  }, [store]);

  const handleNodesCancelSelected = useCallback(() => {
    const { getNodes, setNodes } = store.getState();

    const nodes = getNodes();
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data.selected = false;
      });
    });
    setNodes(newNodes);
  }, [store]);

  const handleNodeContextMenu = useCallback((e: MouseEvent, node: Node) => {
    e.preventDefault();
    const container = document.querySelector("#workflow-container");
    const { x, y } = container!.getBoundingClientRect();
    workflowStore.setState({
      nodeMenu: {
        top: e.clientY - y,
        left: e.clientX - x,
        nodeId: node.id,
      },
    });
    handleNodeSelect(node.id);
  }, []);

  const handleNodesCopy = useCallback(() => {}, []);

  const handleNodesPaste = useCallback(() => {}, []);

  const handleNodesDuplicate = useCallback(() => {
    handleNodesCopy();
    handleNodesPaste();
  }, [handleNodesCopy, handleNodesPaste]);

  const handleNodesDelete = useCallback(() => {}, []);

  const handleNodeResize = useCallback(
    (nodeId: string, params: ResizeParamsWithDirection) => {
      const { getNodes, setNodes } = store.getState();
      const { x, y, width, height } = params;

      const nodes = getNodes();
      const currentNode = nodes.find((n) => n.id === nodeId)!;
      const childrenNodes = nodes.filter((n) =>
        currentNode.data._children?.includes(n.id)
      );
      let rightNode: Node;
      let bottomNode: Node;

      childrenNodes.forEach((n) => {
        if (rightNode) {
          if (n.position.x + n.width! > rightNode.position.x + rightNode.width!)
            rightNode = n;
        } else {
          rightNode = n;
        }
        if (bottomNode) {
          if (
            n.position.y + n.height! >
            bottomNode.position.y + bottomNode.height!
          )
            bottomNode = n;
        } else {
          bottomNode = n;
        }
      });

      if (rightNode! && bottomNode!) {
        if (
          width <
          rightNode!.position.x + rightNode.width! + ITERATION_PADDING.right
        )
          return;
        if (
          height <
          bottomNode.position.y + bottomNode.height! + ITERATION_PADDING.bottom
        )
          return;
      }
      const newNodes = produce(nodes, (draft) => {
        draft.forEach((n) => {
          if (n.id === nodeId) {
            n.data.width = width;
            n.data.height = height;
            n.width = width;
            n.height = height;
            n.position.x = x;
            n.position.y = y;
          }
        });
      });
      setNodes(newNodes);
      saveStateToHistory(WorkflowHistoryEvent.NodeResize);
    },
    [store, saveStateToHistory]
  );

  const handleHistoryBack = useCallback(() => {}, [store, undo, workflowStore]);

  const handleHistoryForward = useCallback(() => {}, [
    redo,
    store,
    workflowStore,
  ]);

  return {
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    handleNodeEnter,
    handleNodeLeave,
    handleNodeSelect,
    handleNodeClick,
    handleNodeConnect,
    handleNodeConnectStart,
    handleNodeConnectEnd,
    handleNodeDelete,
    handleNodeChange,
    handleNodeAdd,
    handleNodeCancelRunningStatus,
    handleNodesCancelSelected,
    handleNodeContextMenu,
    handleNodesCopy,
    handleNodesPaste,
    handleNodesDuplicate,
    handleNodesDelete,
    handleNodeResize,
    handleHistoryBack,
    handleHistoryForward,
  };
};
