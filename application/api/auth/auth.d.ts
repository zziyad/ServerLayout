type ApiErrorMeta = {
  code: string
  message: string
  user_message?: string
  details?: Record<string, unknown>
  severity?: 'error' | 'warning' | 'info'
}

type ApiFulfilled<T> = {
  status: 'fulfilled'
  response: T
}

type ApiRejected = {
  status: 'rejected'
  response: string
  error?: ApiErrorMeta | null
}

type ApiResponse<T> = ApiFulfilled<T> | ApiRejected

declare namespace api.auth {
  function signin(parameters: {
    email: string
    password: string
  }): Promise<
    ApiResponse<{
      id: string
      email: string
      username?: string | null
      first_name?: string
      last_name?: string
      display_name?: string | null
      roles?: unknown[]
      permissions?: string[]
      [key: string]: unknown
    }>
  >

  function register(parameters: Record<string, unknown>): Promise<
    ApiResponse<{
      message: string
      user: {
        id: string
        email: string
        username?: string | null
        first_name?: string
        last_name?: string
        display_name?: string | null
      }
    }>
  >

  function me(parameters?: Record<string, unknown>): Promise<
    ApiResponse<Record<string, unknown> | null>
  >

  function logout(parameters?: { destroy_all?: boolean }): Promise<
    ApiResponse<string>
  >

  function keepAlive(parameters?: Record<string, unknown>): Promise<
    ApiResponse<{
      session: {
        expires_at?: string
        idle_timeout_seconds?: number
        idle_remaining_seconds?: number
        absolute_expires_at?: string
        absolute_remaining_seconds?: number
      }
    }>
  >

  function sessionKeepAlive(parameters?: Record<string, unknown>): Promise<
    ApiResponse<{
      session: {
        expires_at?: string
        idle_timeout_seconds?: number
        idle_remaining_seconds?: number
        absolute_expires_at?: string
        absolute_remaining_seconds?: number
      }
    }>
  >

  function refresh(parameters?: Record<string, unknown>): Promise<ApiResponse<string>>

  function restore(parameters: { token: string }): Promise<ApiResponse<null>>

  function activity(parameters?: Record<string, unknown>): Promise<
    ApiResponse<{
      extended: boolean
      message: string
    }>
  >

  function stats(parameters?: Record<string, unknown>): Promise<
    ApiResponse<{
      timestamp: string
      clients: unknown
      server: {
        uptime: number
        memory: NodeJS.MemoryUsage
        nodeVersion: string
      }
    }>
  >
}
