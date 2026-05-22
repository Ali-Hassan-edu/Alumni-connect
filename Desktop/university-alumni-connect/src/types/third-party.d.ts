declare module 'formidable' {
  const formidable: any
  export default formidable
  export type File = any
  export type Files = any
  export type Fields = any
}

declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from 'http'
  export type VercelRequest = IncomingMessage & { query?: any; cookies?: any; body?: any }
  export type VercelResponse = ServerResponse & {
    json: (body: any) => VercelResponse
    status: (code: number) => VercelResponse
    send: (body: any) => VercelResponse
  }
}
