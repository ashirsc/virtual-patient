import { PrismaClient } from '../lib/generated/client'

const prisma = new PrismaClient()

// Function to create a slug from a name
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim()
}

async function main() {
    console.log('🔄 Migrating patient actors to add slugs...')

    // Find patient actors with empty slugs or regenerate all
    const patientActors = await prisma.patientActor.findMany({
        where: {
            OR: [
                { slug: '' },
                { slug: { startsWith: 'temp-' } }
            ]
        }
    })

    console.log(`Found ${patientActors.length} patient actors without proper slugs`)

    for (const actor of patientActors) {
        let slug = createSlug(actor.name)
        let counter = 1

        // Check if slug exists, if so add a number
        while (await prisma.patientActor.findUnique({ where: { slug } })) {
            slug = `${createSlug(actor.name)}-${counter}`
            counter++
        }

        await prisma.patientActor.update({
            where: { id: actor.id },
            data: { slug }
        })

        console.log(`✅ Updated ${actor.name} with slug: ${slug}`)
    }

    console.log('🎉 Migration complete!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error migrating slugs:', e)
        await prisma.$disconnect()
        process.exit(1)
    })

