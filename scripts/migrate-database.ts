import { PrismaClient } from '@prisma/client';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Validate environment variables
if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    process.exit(1);
}

// Create two separate Prisma clients
const oldDb = new PrismaClient({
    datasources: {
        db: {
            url: process.env.NEON_DATABASE_URL,
        },
    },
});

const newDb = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// Statistics tracking
interface MigrationStats {
    users: {
        total: number;
        migrated: number;
        skipped: number;
        failed: number;
    };
    accounts: {
        total: number;
        migrated: number;
        failed: number;
    };
    patientActors: {
        total: number;
        migrated: number;
        failed: number;
    };
}

const stats: MigrationStats = {
    users: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    accounts: { total: 0, migrated: 0, failed: 0 },
    patientActors: { total: 0, migrated: 0, failed: 0 },
};

/**
 * Detect column naming conventions in the old database
 */
async function detectColumnNames(db: PrismaClient): Promise<{
    accountUserId: string;
    patientActorOwnerId: string;
}> {
    // Check account table for user_id vs userId
    let accountUserId = 'user_id';
    try {
        const accountColumns = await db.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account' AND table_schema = 'public'
    `;
        const columnNamesList = accountColumns.map((col) => col.column_name);
        if (columnNamesList.includes('userId')) {
            accountUserId = 'userId';
        } else if (columnNamesList.includes('user_id')) {
            accountUserId = 'user_id';
        }
    } catch (error) {
        console.warn('  ⚠️  Could not detect account column names, using user_id as default');
    }

    // Check patient_actor table for owner_id vs ownerId
    let patientActorOwnerId = 'owner_id';
    try {
        const patientActorColumns = await db.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patient_actor' AND table_schema = 'public'
    `;
        const columnNamesList = patientActorColumns.map((col) => col.column_name);
        if (columnNamesList.includes('ownerId')) {
            patientActorOwnerId = 'ownerId';
        } else if (columnNamesList.includes('owner_id')) {
            patientActorOwnerId = 'owner_id';
        }
    } catch (error) {
        console.warn('  ⚠️  Could not detect patient_actor column names, using owner_id as default');
    }

    return { accountUserId, patientActorOwnerId };
}

/**
 * Main migration function
 */
async function migrateDatabase() {
    console.log('🚀 Starting database migration...\n');
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE MIGRATION'}\n`);
    console.log(`Old DB: ${process.env.NEON_DATABASE_URL?.substring(0, 50)}...`);
    console.log(`New DB: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);

    try {
        // Test connections
        console.log('🔌 Testing database connections...');
        await oldDb.$connect();
        await newDb.$connect();
        console.log('✅ Both databases connected successfully\n');

        // Detect column naming conventions
        console.log('🔍 Detecting database schema...');
        const columnNames = await detectColumnNames(oldDb);
        console.log(`   Account user column: ${columnNames.accountUserId}`);
        console.log(`   Patient actor owner column: ${columnNames.patientActorOwnerId}\n`);

        // Fetch all users from old database using raw SQL
        console.log('📊 Fetching users from old database...');
        const oldUsers = await oldDb.$queryRaw<any[]>`
      SELECT * FROM "user"
    `;

        stats.users.total = oldUsers.length;
        console.log(`Found ${oldUsers.length} users to migrate\n`);

        // Migrate each user
        for (const user of oldUsers) {
            // Fetch accounts for this user using detected column name
            const accounts = (await oldDb.$queryRawUnsafe(
                `SELECT * FROM "account" WHERE "${columnNames.accountUserId}" = $1`,
                user.id
            )) as any[];

            // Fetch patient actors for this user using detected column name
            const patientActors = (await oldDb.$queryRawUnsafe(
                `SELECT * FROM "patient_actor" WHERE "${columnNames.patientActorOwnerId}" = $1`,
                user.id
            )) as any[];

            await migrateUser(user, accounts, patientActors);
        }

        // Print summary
        printSummary();

        console.log(isDryRun ? '\n✅ Dry run completed successfully!' : '\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await oldDb.$disconnect();
        await newDb.$disconnect();
    }
}

/**
 * Migrate a single user and their related data
 */
async function migrateUser(user: any, accounts: any[], patientActors: any[]) {
    try {
        console.log(`\n👤 Processing user: ${user.email} (${user.id})`);

        // Check if user already exists in new database
        const existingUser = await newDb.user.findUnique({
            where: { email: user.email },
        });

        if (existingUser) {
            console.log(`  ⏭️  Skipping - user with email "${user.email}" already exists`);
            stats.users.skipped++;
            return;
        }

        // Prepare user data - only use fields that exist
        const userData: any = {
            id: user.id,
            email: user.email,
        };

        // Add optional fields if they exist
        if (user.name !== undefined) userData.name = user.name;
        if (user.email_verified !== undefined) userData.emailVerified = user.email_verified;
        if (user.emailVerified !== undefined) userData.emailVerified = user.emailVerified;
        if (user.image !== undefined) userData.image = user.image;
        if (user.role !== undefined) userData.role = user.role;
        if (user.created_at !== undefined) userData.createdAt = user.created_at;
        if (user.createdAt !== undefined) userData.createdAt = user.createdAt;
        if (user.updated_at !== undefined) userData.updatedAt = user.updated_at;
        if (user.updatedAt !== undefined) userData.updatedAt = user.updatedAt;

        if (!isDryRun) {
            // Create user in new database
            await newDb.user.create({
                data: userData,
            });
        }

        console.log(`  ✅ User migrated`);
        stats.users.migrated++;

        // Migrate user's accounts
        if (accounts && accounts.length > 0) {
            console.log(`  📎 Migrating ${accounts.length} account(s)...`);
            for (const account of accounts) {
                await migrateAccount(account, user.id);
            }
        }

        // Migrate user's patient actors
        if (patientActors && patientActors.length > 0) {
            console.log(`  🏥 Migrating ${patientActors.length} patient actor(s)...`);
            for (const patientActor of patientActors) {
                await migratePatientActor(patientActor, user.id);
            }
        }
    } catch (error) {
        console.error(`  ❌ Failed to migrate user ${user.email}:`, error);
        stats.users.failed++;
    }
}

/**
 * Migrate a single account
 */
async function migrateAccount(account: any, userId: string) {
    try {
        stats.accounts.total++;

        // Build account data dynamically - only use fields that exist
        const accountData: any = {
            id: account.id,
            userId: userId,
        };

        // Handle snake_case and camelCase variants
        if (account.account_id !== undefined) accountData.accountId = account.account_id;
        if (account.accountId !== undefined) accountData.accountId = account.accountId;
        if (account.provider_id !== undefined) accountData.providerId = account.provider_id;
        if (account.providerId !== undefined) accountData.providerId = account.providerId;
        if (account.access_token !== undefined) accountData.accessToken = account.access_token;
        if (account.accessToken !== undefined) accountData.accessToken = account.accessToken;
        if (account.refresh_token !== undefined) accountData.refreshToken = account.refresh_token;
        if (account.refreshToken !== undefined) accountData.refreshToken = account.refreshToken;
        if (account.id_token !== undefined) accountData.idToken = account.id_token;
        if (account.idToken !== undefined) accountData.idToken = account.idToken;
        if (account.access_token_expires_at !== undefined) accountData.accessTokenExpiresAt = account.access_token_expires_at;
        if (account.accessTokenExpiresAt !== undefined) accountData.accessTokenExpiresAt = account.accessTokenExpiresAt;
        if (account.refresh_token_expires_at !== undefined) accountData.refreshTokenExpiresAt = account.refresh_token_expires_at;
        if (account.refreshTokenExpiresAt !== undefined) accountData.refreshTokenExpiresAt = account.refreshTokenExpiresAt;
        if (account.scope !== undefined) accountData.scope = account.scope;
        if (account.password !== undefined) accountData.password = account.password;
        if (account.created_at !== undefined) accountData.createdAt = account.created_at;
        if (account.createdAt !== undefined) accountData.createdAt = account.createdAt;
        if (account.updated_at !== undefined) accountData.updatedAt = account.updated_at;
        if (account.updatedAt !== undefined) accountData.updatedAt = account.updatedAt;

        if (!isDryRun) {
            await newDb.account.create({
                data: accountData,
            });
        }

        const providerId = account.provider_id || account.providerId || 'unknown';
        console.log(`    ✅ Account migrated (${providerId})`);
        stats.accounts.migrated++;
    } catch (error) {
        console.error(`    ❌ Failed to migrate account:`, error);
        stats.accounts.failed++;
    }
}

/**
 * Migrate a single patient actor
 */
async function migratePatientActor(patientActor: any, ownerId: string) {
    try {
        stats.patientActors.total++;

        // Build patient actor data dynamically - only use fields that exist
        const patientActorData: any = {
            id: patientActor.id,
            ownerId: ownerId,
        };

        // Add required fields
        if (patientActor.name !== undefined) patientActorData.name = patientActor.name;
        if (patientActor.age !== undefined) patientActorData.age = patientActor.age;
        if (patientActor.slug !== undefined) patientActorData.slug = patientActor.slug;

        // Handle snake_case and camelCase variants for optional fields
        if (patientActor.is_public !== undefined) patientActorData.isPublic = patientActor.is_public;
        if (patientActor.isPublic !== undefined) patientActorData.isPublic = patientActor.isPublic;
        if (patientActor.allow_submissions !== undefined) patientActorData.allowSubmissions = patientActor.allow_submissions;
        if (patientActor.allowSubmissions !== undefined) patientActorData.allowSubmissions = patientActor.allowSubmissions;
        if (patientActor.demographics !== undefined) patientActorData.demographics = patientActor.demographics;
        if (patientActor.chief_complaint !== undefined) patientActorData.chiefComplaint = patientActor.chief_complaint;
        if (patientActor.chiefComplaint !== undefined) patientActorData.chiefComplaint = patientActor.chiefComplaint;
        if (patientActor.medical_history !== undefined) patientActorData.medicalHistory = patientActor.medical_history;
        if (patientActor.medicalHistory !== undefined) patientActorData.medicalHistory = patientActor.medicalHistory;
        if (patientActor.medications !== undefined) patientActorData.medications = patientActor.medications;
        if (patientActor.social_history !== undefined) patientActorData.socialHistory = patientActor.social_history;
        if (patientActor.socialHistory !== undefined) patientActorData.socialHistory = patientActor.socialHistory;
        if (patientActor.personality !== undefined) patientActorData.personality = patientActor.personality;
        if (patientActor.physical_findings !== undefined) patientActorData.physicalFindings = patientActor.physical_findings;
        if (patientActor.physicalFindings !== undefined) patientActorData.physicalFindings = patientActor.physicalFindings;
        if (patientActor.additional_symptoms !== undefined) patientActorData.additionalSymptoms = patientActor.additional_symptoms;
        if (patientActor.additionalSymptoms !== undefined) patientActorData.additionalSymptoms = patientActor.additionalSymptoms;
        if (patientActor.revelation_level !== undefined) patientActorData.revelationLevel = patientActor.revelation_level;
        if (patientActor.revelationLevel !== undefined) patientActorData.revelationLevel = patientActor.revelationLevel;
        if (patientActor.stay_in_character !== undefined) patientActorData.stayInCharacter = patientActor.stay_in_character;
        if (patientActor.stayInCharacter !== undefined) patientActorData.stayInCharacter = patientActor.stayInCharacter;
        if (patientActor.avoid_medical_jargon !== undefined) patientActorData.avoidMedicalJargon = patientActor.avoid_medical_jargon;
        if (patientActor.avoidMedicalJargon !== undefined) patientActorData.avoidMedicalJargon = patientActor.avoidMedicalJargon;
        if (patientActor.provide_feedback !== undefined) patientActorData.provideFeedback = patientActor.provide_feedback;
        if (patientActor.provideFeedback !== undefined) patientActorData.provideFeedback = patientActor.provideFeedback;
        if (patientActor.custom_instructions !== undefined) patientActorData.customInstructions = patientActor.custom_instructions;
        if (patientActor.customInstructions !== undefined) patientActorData.customInstructions = patientActor.customInstructions;
        if (patientActor.prompt !== undefined) patientActorData.prompt = patientActor.prompt;
        if (patientActor.created_at !== undefined) patientActorData.createdAt = patientActor.created_at;
        if (patientActor.createdAt !== undefined) patientActorData.createdAt = patientActor.createdAt;
        if (patientActor.updated_at !== undefined) patientActorData.updatedAt = patientActor.updated_at;
        if (patientActor.updatedAt !== undefined) patientActorData.updatedAt = patientActor.updatedAt;

        if (!isDryRun) {
            await newDb.patientActor.create({
                data: patientActorData,
            });
        }

        console.log(`    ✅ Patient Actor migrated: "${patientActor.name}" (${patientActor.slug})`);
        stats.patientActors.migrated++;
    } catch (error) {
        console.error(`    ❌ Failed to migrate patient actor "${patientActor.name}":`, error);
        stats.patientActors.failed++;
    }
}

/**
 * Print migration summary
 */
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));

    console.log('\n👥 USERS:');
    console.log(`   Total found:     ${stats.users.total}`);
    console.log(`   Migrated:        ${stats.users.migrated}`);
    console.log(`   Skipped:         ${stats.users.skipped} (already exist)`);
    console.log(`   Failed:          ${stats.users.failed}`);

    console.log('\n🔑 ACCOUNTS:');
    console.log(`   Total found:     ${stats.accounts.total}`);
    console.log(`   Migrated:        ${stats.accounts.migrated}`);
    console.log(`   Failed:          ${stats.accounts.failed}`);

    console.log('\n🏥 PATIENT ACTORS:');
    console.log(`   Total found:     ${stats.patientActors.total}`);
    console.log(`   Migrated:        ${stats.patientActors.migrated}`);
    console.log(`   Failed:          ${stats.patientActors.failed}`);

    console.log('\n' + '='.repeat(60));
}

// Run the migration
migrateDatabase()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

