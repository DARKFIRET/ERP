import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';

export const seedDatabase = async () => {
  const pool = getPool();
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database for seeding');

    // Roles
    await client.query(`CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE);`);
    const { rows: existingRoles } = await client.query('SELECT COUNT(*) FROM roles');
    if (parseInt(existingRoles[0].count) === 0) {
      for (const role of ['admin', 'waiter', 'cook', 'manager']) {
        await client.query('INSERT INTO roles (name) VALUES ($1)', [role]);
      }
    }

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_id INTEGER REFERENCES roles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const { rows: existingUsers } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers[0].count) === 0) {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('password123', salt);
      const rolesRes = await client.query('SELECT id, name FROM roles');
      const rolesMap = new Map(rolesRes.rows.map(r => [r.name, r.id]));
      const users = [
          { username: 'admin', role: 'admin', first: 'Admin', last: 'User' },
          { username: 'waiter', role: 'waiter', first: 'John', last: 'Doe' },
          { username: 'cook', role: 'cook', first: 'Chef', last: 'Gordon' },
          { username: 'manager', role: 'manager', first: 'Boss', last: 'Man' }
      ];
      for (const user of users) {
          const roleId = rolesMap.get(user.role);
          if (roleId) await client.query('INSERT INTO users (username, password_hash, role_id, first_name, last_name) VALUES ($1, $2, $3, $4, $5)', [user.username, password, roleId, user.first, user.last]);
      }
    }

    // Shifts
    await client.query(`CREATE TABLE IF NOT EXISTS shifts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), start_time TIMESTAMP NOT NULL, end_time TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

    // Tables
    await client.query(`CREATE TABLE IF NOT EXISTS tables (id SERIAL PRIMARY KEY, number INTEGER NOT NULL UNIQUE, seats INTEGER NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'free', x INTEGER DEFAULT 0, y INTEGER DEFAULT 0);`);
    const { rows: existingTables } = await client.query('SELECT COUNT(*) FROM tables');
    if (parseInt(existingTables[0].count) === 0) {
      for (let i = 1; i <= 12; i++) await client.query('INSERT INTO tables (number, seats, status) VALUES ($1, $2, $3)', [i, 4, 'free']);
    }

    // Clients (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Time Slots
    await client.query(`CREATE TABLE IF NOT EXISTS time_slots (id SERIAL PRIMARY KEY, start_time TIME NOT NULL UNIQUE);`);
    const { rows: existingSlots } = await client.query('SELECT COUNT(*) FROM time_slots');
    if (parseInt(existingSlots[0].count) === 0) {
        for (let h = 9; h <= 21; h++) await client.query('INSERT INTO time_slots (start_time) VALUES ($1)', [`${h.toString().padStart(2, '0')}:00:00`]);
    }

    // Bookings (Updated with client_id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES tables(id),
        client_id INTEGER REFERENCES clients(id),
        guest_name VARCHAR(100),
        phone VARCHAR(20),
        pax INTEGER NOT NULL,
        booking_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try { await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)'); } catch (e) {}
    try { await client.query('ALTER TABLE bookings ALTER COLUMN guest_name DROP NOT NULL'); } catch (e) {}
    try { await client.query('ALTER TABLE bookings ALTER COLUMN phone DROP NOT NULL'); } catch (e) {}

    // Booking Time Slots
    await client.query(`CREATE TABLE IF NOT EXISTS booking_time_slots (booking_id INTEGER REFERENCES bookings(id), time_slot_id INTEGER REFERENCES time_slots(id), PRIMARY KEY (booking_id, time_slot_id));`);

    // Menu Items
    await client.query(`CREATE TABLE IF NOT EXISTS menu_items (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, price INTEGER NOT NULL, category VARCHAR(100), image_url TEXT);`);
    const menuItems = [
        { name: 'Цезарь с курицей', price: 450, category: 'Салаты', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Caesar+Salad' },
        { name: 'Борщ', price: 350, category: 'Супы', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Borsch' },
        { name: 'Стейк Рибай', price: 2500, category: 'Горячее', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Ribeye+Steak' },
        { name: 'Паста Карбонара', price: 550, category: 'Паста', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Carbonara' },
        { name: 'Тирамису', price: 400, category: 'Десерты', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Tiramisu' },
        { name: 'Капучино', price: 250, category: 'Напитки', image_url: 'https://placehold.co/600x400/e0e0e0/333333?text=Cappuccino' }
    ];
    const { rows: existingMenu } = await client.query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(existingMenu[0].count) === 0) {
        for (const item of menuItems) await client.query('INSERT INTO menu_items (name, price, category, image_url) VALUES ($1, $2, $3, $4)', [item.name, item.price, item.category, item.image_url]);
    }

    // Orders (Updated with client_id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        table_id INTEGER REFERENCES tables(id),
        client_id INTEGER REFERENCES clients(id),
        status VARCHAR(50) DEFAULT 'open',
        total INTEGER DEFAULT 0,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try { await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)'); } catch (e) {}

    // Order Items
    await client.query(`CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), menu_item_id INTEGER REFERENCES menu_items(id), quantity INTEGER NOT NULL, price INTEGER NOT NULL);`);

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (client) client.release();
  }
};
