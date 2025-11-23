import { PrismaClient } from './generated/client/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
    const connectionString = process.env.POSTGRES_URL
    if (!connectionString) {
        throw new Error('POSTGRES_URL environment variable is not set')
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    // or just create with a standard connection, this is from the docs
    // const adapter = new PrismaPg({
    //     connectionString: process.env.DATABASE_URL
    // });
    return new PrismaClient({ adapter })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

