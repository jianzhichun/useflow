export const useWorkflowInit = () => {
  return {
    data: {
      id: 'demo',
      graph: {
        nodes: [],
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        }
      },
      created_at: Date.now(),
      hash: 'demo123123',
      updated_at: Date.now(),
    },
    isLoading: false,
  }
}
