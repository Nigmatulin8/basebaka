import { createContext, useContext } from 'react'
import { DEFAULT_SERVER_PORT } from '../../shared/config.ts'

export const ServerPortContext = createContext(DEFAULT_SERVER_PORT)

export function useServerPort(): number {
  return useContext(ServerPortContext)
}
