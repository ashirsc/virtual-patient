import { config } from 'dotenv'
import { resolve } from 'path'

// Set NODE_ENV to test so Prisma uses SQLite adapter
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
  enumerable: true,
  configurable: true,
})

// Load .env.local for any additional configuration (optional for tests)
config({ path: resolve(process.cwd(), '.env.local') })


