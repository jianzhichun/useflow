import { useCallback, useEffect, useMemo, useState } from "react"
import { useWorkflowStore } from "../store"
import { FetchWorkflowDraftResponse } from "@/types/workflow"
import { workflowInitData } from '@/mockData/workflow'

export const useWorkflowInit = () => {
  const workflowStore = useWorkflowStore()
  const [data, setData] = useState<FetchWorkflowDraftResponse>()
  const [isLoading, setIsLoading] = useState(true)

  const handleGetInitialWorkflowData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await Promise.resolve<FetchWorkflowDraftResponse>(workflowInitData)
      setData(data)
    } finally {
      setIsLoading(false)
    }
  }, [workflowStore])

  useEffect(() => {
    handleGetInitialWorkflowData()
  }, [])

  return {
    data,
    isLoading,
  }
}