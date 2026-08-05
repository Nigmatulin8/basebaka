/** Defaults and file names for Basebaka runtime config. */

export const DEFAULT_SERVER_PORT = 3001
export const SERVER_HOST = '127.0.0.1'

/** Committed defaults. */
export const CONFIG_FILE_NAME = 'basebaka.config.json'

/** Optional per-machine overrides (gitignored). */
export const LOCAL_CONFIG_FILE_NAME = 'basebaka.config.local.json'

/** Env override — wins over config files. */
export const SERVER_PORT_ENV = 'BASEBAKA_SERVER_PORT'

export type BasebakaConfigFile = {
  serverPort?: number
}
