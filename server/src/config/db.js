const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const prisma = new PrismaClient({
  datasourceUrl: connectionString,
});

module.exports = prisma;
