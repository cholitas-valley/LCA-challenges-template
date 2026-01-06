import pg from 'pg';

const { Pool } = pg;

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://plantops:plantops_password@postgres:5432/plantops',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection verified');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Close database pool
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database pool closed');
}
