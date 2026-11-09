import { handle, type Env } from './handler.ts'

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
}
