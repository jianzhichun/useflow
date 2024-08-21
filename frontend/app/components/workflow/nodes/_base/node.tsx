import type { FC, ReactElement } from "react";
import { cloneElement, memo, useEffect, useRef } from "react";
import { BlockEnum, type NodeProps } from "../../types";
import cn from "@/utils/classnames";
import { useNodeIterationInteractions } from "../iteration/use-interactions";
import { NodeSourceHandle, NodeTargetHandle } from "./components/node-handle";

type BaseNodeProps = {
  children: ReactElement;
} & NodeProps;

const BaseNode: FC<BaseNodeProps> = ({ id, data, children }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { handleNodeIterationChildSizeChange } = useNodeIterationInteractions();

  useEffect(() => {
    if (nodeRef.current && data.selected) {
      const resizeObserver = new ResizeObserver(() => {
        handleNodeIterationChildSizeChange(id);
      });

      resizeObserver.observe(nodeRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [
    data.isInIteration,
    data.selected,
    id,
    handleNodeIterationChildSizeChange,
  ]);

  const showSelectedBorder =
    data.selected || data._isBundled || data._isEntering;

  return (
    <div
      className={cn(
        "flex border-[2px] rounded-2xl",
        showSelectedBorder
          ? "border-components-option-card-option-selected-border"
          : "border-transparent"
      )}
      ref={nodeRef}
      style={{
        width: "auto",
        height: "auto",
      }}
    >
      <div
        className={cn(
          "group relative pb-1 shadow-xs",
          "border border-transparent rounded-[15px]",
          "w-[180px] bg-workflow-block-bg",
          !data._runningStatus && "hover:shadow-lg",
          data._isBundled && "!shadow-lg"
        )}
      >
        {!data._isCandidate && (
          <NodeTargetHandle
            id={id}
            data={data}
            handleClassName="!top-4 !-left-[9px] !translate-y-0"
            handleId="target"
          />
        )}
        {!data._isCandidate && (
          <NodeSourceHandle
            id={id}
            data={data}
            handleClassName="!top-4 !-right-[9px] !translate-y-0"
            handleId="source"
          />
        )}

        <div className={cn("flex items-center px-3 pt-3 pb-2 rounded-t-2xl")}>
          <div
            title={data.title}
            className="grow mr-1 system-sm-semibold-uppercase text-text-primary truncate"
          >
            {data.title}
          </div>
          {cloneElement(children, { id, data })}
          {data.desc && (
            <div className="px-3 pt-1 pb-2 system-xs-regular text-text-tertiary whitespace-pre-line break-words">
              {data.desc}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(BaseNode);
