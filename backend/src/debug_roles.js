import { query } from './config/db.js';
import { seedDatabase } from './utils/seed.js';
const checkRoles = async () => {
    try {
        await seedDatabase();
        const res = await query('SELECT * FROM roles');
        console.log('Roles in DB:', res.rows);
    }
    catch (err) {
        console.error('Error checking roles:', err);
    }
};
checkRoles();
//# sourceMappingURL=debug_roles.js.map