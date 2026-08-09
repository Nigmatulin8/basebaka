export const DEFAULT_SERVER_PORT = 3001
export const SERVER_HOST = '127.0.0.1'

export const CONFIG_FILE_NAME = 'basebaka.config.json'
export const LOCAL_CONFIG_FILE_NAME = 'basebaka.config.local.json'

export const SERVER_PORT_ENV = 'BASEBAKA_SERVER_PORT'
export const BASEBAKA_CONFIG_DIR_ENV = 'BASEBAKA_CONFIG_DIR'

export type BasebakaConfigFile = {
  serverPort?: number
  googleOAuthClientId?: string
  googleOAuthClientSecret?: string
}

export const GOOGLE_OAUTH_CLIENT_ID_ENV = 'GOOGLE_OAUTH_CLIENT_ID'
export const GOOGLE_OAUTH_CLIENT_SECRET_ENV = 'GOOGLE_OAUTH_CLIENT_SECRET'
export const GOOGLE_CLIENT_ID_ENV = 'GOOGLE_CLIENT_ID'
export const GOOGLE_CLIENT_SECRET_ENV = 'GOOGLE_CLIENT_SECRET'
