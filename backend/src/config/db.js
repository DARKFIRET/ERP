import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
    user: process.env.DB_USER || 'cafe',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cafe_erp',
    password: process.env.DB_PASSWORD || 'cafe_password',
    port: Number(process.env.DB_PORT) || 5432,
});
export const query = (text, params) => pool.query(text, params);
export const getPool = () => pool;
//# sourceMappingURL=db.js.map