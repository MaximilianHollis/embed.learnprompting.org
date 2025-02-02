import {
  QueryClient,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query'
import ky from 'ky'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient, removeOldestQuery } from '@tanstack/react-query-persist-client'


export const client = ({ signal }: { signal?: AbortSignal } = { signal: undefined }) =>
  ky.extend({
    prefixUrl: import.meta.env.VITE_SERVER_HOST,
    headers: {
      authorization: `Bearer ${typeof window === 'object' && localStorage.getItem('token')
        }`,
    },
    signal,
    throwHttpErrors: true,
    timeout: 30000,
  })

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 15607,
      staleTime: 10000,
      retry: 3,
      retryDelay: 1000,
    },
  },
})


const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
})

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
})

export const useIsLoggedIn = () => useSuspenseQuery({
  queryKey: ['isLoggedIn'],
  queryFn: () => {
    const token = localStorage.getItem('token')
    return !!token
  }
}).data!



export const useApiKey = () => useSuspenseQuery({
  queryKey: ['apiKey'],
  queryFn: async () => localStorage.getItem('apiKey')
}).data!

export const useEditApiKey = () => useMutation({
  mutationKey: ['apiKey'],
  mutationFn: (apiKey: string) => client().put('apiKey', { json: { apiKey: apiKey } }),
  onMutate: async (newApiKey) => {
    localStorage.setItem('apiKey', newApiKey)
    queryClient.setQueryData(['apiKey'], newApiKey)
    return newApiKey
  },
  onSettled: () => {
    queryClient.invalidateQueries()
  }
})
