const { app } = require('@azure/functions');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

app.timer('spreadsheet-processor', {
    schedule: '0 */5 * * * *',
    handler: async (myTimer, context) => {
        context.log('🔍 Spreadsheet Generator - Checking for pending jobs...');

        try {
            // Test database connection
            const pendingJobs = await prisma.spreadsheet_generation_queue.findMany({
                where: { status: 'pending' },
                orderBy: [
                    { priority: 'desc' },
                    { queued_at: 'asc' }
                ],
                include: {
                    set: true
                },
                take: 5
            });

            context.log(`✅ Database connected! Found ${pendingJobs.length} pending job(s)`);

            if (pendingJobs.length > 0) {
                pendingJobs.forEach(job => {
                    context.log(`   📋 Queue ID: ${job.queue_id}, Set: ${job.set?.name} (${job.set?.year})`);
                });
            }

        } catch (error) {
            context.log(`❌ Error: ${error.message}`);
            context.log(error.stack);
        } finally {
            await prisma.$disconnect();
        }
    }
});
