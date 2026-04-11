import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Expose MOODLE variables to the process for the local handler
  process.env.MOODLE_BASE_URL = env.VITE_MOODLE_BASE_URL || 'https://lms2.ai.saveetha.in'
  process.env.MOODLE_TOKEN = env.VITE_MOODLE_TOKEN
  
  // Disable SSL verification for internal university services that might have self-signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  return {
    plugins: [
      react(),
      {
        name: 'moodle-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/moodle' && req.method === 'POST') {
              console.log('--- Incoming Moodle Sync Request ---')
              try {
                // Read the body
                const chunks = []
                for await (const chunk of req) {
                  chunks.push(chunk)
                }
                const bodyStr = Buffer.concat(chunks).toString()
                console.log('Request body length:', bodyStr.length)
                
                let body = {}
                try {
                  body = JSON.parse(bodyStr)
                } catch (pe) {
                  console.error('Failed to parse body:', bodyStr)
                }
                
                // Import the handler dynamically using a file URL to avoid Vite's static analysis issues
                const handlerPath = join(process.cwd(), 'api', 'moodle.js')
                const { default: handler } = await import(`file://${handlerPath}?t=${Date.now()}`)
                
                // Mock req/res for the Vercel-style handler
                const mockReq = {
                  method: 'POST',
                  body: body,
                  headers: req.headers
                }
                
                const mockRes = {
                  status(code) {
                    res.statusCode = code
                    console.log('Response status:', code)
                    return this
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                    return this
                  },
                  setHeader(key, value) {
                    res.setHeader(key, value)
                    return this
                  }
                }
                
                await handler(mockReq, mockRes)
              } catch (error) {
                console.log('!!! API EXECUTION ERROR !!!')
                console.log(error)
                if (error.stack) console.log(error.stack)
                res.statusCode = 500
                res.end(JSON.stringify({ error: error.message, stack: error.stack }))
              }
              console.log('--- Request Handled ---')
              return
            }
            next()
          })
        }
      }
    ],
  }
})
