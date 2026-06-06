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
    try { await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id)'); } catch (e) {}

    // Order Items
    await client.query(`CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), menu_item_id INTEGER REFERENCES menu_items(id), quantity INTEGER NOT NULL, price INTEGER NOT NULL);`);

    // App settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key        VARCHAR(100) PRIMARY KEY,
        value      TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const defaultSettings = [
      { key: 'mode',         value: 'light'    },
      { key: 'primaryColor', value: '#1976d2'  },
      { key: 'appName',      value: 'Кафе ERP' },
      { key: 'iconDataUrl',  value: ''         },
    ];
    for (const s of defaultSettings) {
      await client.query(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [s.key, s.value]
      );
    }

    // Ingredients
    await client.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(200) NOT NULL,
        unit          VARCHAR(50)  NOT NULL,
        cost_price    DECIMAL(10,4) NOT NULL DEFAULT 0,
        current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
        min_stock     DECIMAL(10,3) NOT NULL DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Recipes (ingredients per menu item)
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_item_ingredients (
        id            SERIAL PRIMARY KEY,
        menu_item_id  INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE RESTRICT,
        quantity      DECIMAL(10,4) NOT NULL,
        recipe_unit   VARCHAR(50) NOT NULL DEFAULT 'кг',
        UNIQUE(menu_item_id, ingredient_id)
      );
    `);
    try { await client.query("ALTER TABLE menu_item_ingredients ADD COLUMN IF NOT EXISTS recipe_unit VARCHAR(50) NOT NULL DEFAULT 'кг'"); } catch (e) {}

    // Stock movements audit log
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id            SERIAL PRIMARY KEY,
        ingredient_id INTEGER REFERENCES ingredients(id),
        type          VARCHAR(50) NOT NULL,
        quantity      DECIMAL(10,3) NOT NULL,
        reason        TEXT,
        order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed ingredients (idempotent — insert only if name not yet present)
    const allIngredients = [
      { name: 'Курица',               unit: 'кг',  cost_price: 250,  current_stock: 10,  min_stock: 2   },
      { name: 'Мука пшеничная',       unit: 'кг',  cost_price: 40,   current_stock: 15,  min_stock: 3   },
      { name: 'Масло сливочное',      unit: 'кг',  cost_price: 600,  current_stock: 3,   min_stock: 1   },
      { name: 'Картофель',            unit: 'кг',  cost_price: 30,   current_stock: 20,  min_stock: 5   },
      { name: 'Помидоры',             unit: 'кг',  cost_price: 120,  current_stock: 8,   min_stock: 2   },
      { name: 'Спагетти',             unit: 'кг',  cost_price: 80,   current_stock: 5,   min_stock: 1   },
      { name: 'Сливки 33%',           unit: 'л',   cost_price: 180,  current_stock: 4,   min_stock: 1   },
      { name: 'Бекон',                unit: 'кг',  cost_price: 500,  current_stock: 2,   min_stock: 0.5 },
      { name: 'Салат Ромэн',          unit: 'кг',  cost_price: 180,  current_stock: 3,   min_stock: 0.5 },
      { name: 'Пармезан',             unit: 'кг',  cost_price: 1200, current_stock: 1.5, min_stock: 0.3 },
      { name: 'Соус Цезарь',          unit: 'кг',  cost_price: 400,  current_stock: 2,   min_stock: 0.5 },
      { name: 'Сухарики',             unit: 'кг',  cost_price: 100,  current_stock: 1,   min_stock: 0.2 },
      { name: 'Свёкла',               unit: 'кг',  cost_price: 40,   current_stock: 8,   min_stock: 2   },
      { name: 'Капуста белокочанная', unit: 'кг',  cost_price: 25,   current_stock: 6,   min_stock: 2   },
      { name: 'Морковь',              unit: 'кг',  cost_price: 35,   current_stock: 5,   min_stock: 1   },
      { name: 'Лук репчатый',         unit: 'кг',  cost_price: 30,   current_stock: 10,  min_stock: 2   },
      { name: 'Говядина',             unit: 'кг',  cost_price: 600,  current_stock: 8,   min_stock: 2   },
      { name: 'Маскарпоне',           unit: 'кг',  cost_price: 900,  current_stock: 2,   min_stock: 0.5 },
      { name: 'Яйца',                 unit: 'шт',  cost_price: 15,   current_stock: 60,  min_stock: 12  },
      { name: 'Сахар',                unit: 'кг',  cost_price: 60,   current_stock: 5,   min_stock: 1   },
      { name: 'Кофе зерно',           unit: 'кг',  cost_price: 2000, current_stock: 1,   min_stock: 0.3 },
      { name: 'Молоко',               unit: 'л',   cost_price: 80,   current_stock: 5,   min_stock: 1   },
      { name: 'Растительное масло',   unit: 'л',   cost_price: 120,  current_stock: 3,   min_stock: 0.5 },
      { name: 'Сметана',              unit: 'кг',  cost_price: 120,  current_stock: 2,   min_stock: 0.5 },
    ];
    for (const ing of allIngredients) {
      await client.query(
        `INSERT INTO ingredients (name, unit, cost_price, current_stock, min_stock)
         SELECT $1::varchar, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = $1::varchar)`,
        [ing.name, ing.unit, ing.cost_price, ing.current_stock, ing.min_stock]
      );
    }

    // Seed recipes for all dishes (idempotent via ON CONFLICT DO NOTHING)
    // Helper: get IDs by name
    const ingId = async (name: string): Promise<number | null> => {
      const r = await client!.query('SELECT id FROM ingredients WHERE name = $1 LIMIT 1', [name]);
      return r.rows[0]?.id ?? null;
    };
    const menuId = async (name: string): Promise<number | null> => {
      const r = await client!.query('SELECT id FROM menu_items WHERE name = $1 LIMIT 1', [name]);
      return r.rows[0]?.id ?? null;
    };
    const addRecipe = async (dish: string, ing: string, qty: number, unit: string) => {
      const mid = await menuId(dish);
      const iid = await ingId(ing);
      if (mid && iid) {
        await client!.query(
          'INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, recipe_unit) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [mid, iid, qty, unit]
        );
      }
    };

    // Цезарь с курицей
    await addRecipe('Цезарь с курицей', 'Курица',       150, 'г');
    await addRecipe('Цезарь с курицей', 'Салат Ромэн',  100, 'г');
    await addRecipe('Цезарь с курицей', 'Пармезан',      30, 'г');
    await addRecipe('Цезарь с курицей', 'Соус Цезарь',   50, 'г');
    await addRecipe('Цезарь с курицей', 'Сухарики',      20, 'г');

    // Борщ
    await addRecipe('Борщ', 'Говядина',             100, 'г');
    await addRecipe('Борщ', 'Свёкла',               150, 'г');
    await addRecipe('Борщ', 'Капуста белокочанная', 100, 'г');
    await addRecipe('Борщ', 'Картофель',            100, 'г');
    await addRecipe('Борщ', 'Морковь',               50, 'г');
    await addRecipe('Борщ', 'Лук репчатый',          50, 'г');
    await addRecipe('Борщ', 'Сметана',               50, 'г');

    // Стейк Рибай
    await addRecipe('Стейк Рибай', 'Говядина',           300, 'г');
    await addRecipe('Стейк Рибай', 'Масло сливочное',     20, 'г');
    await addRecipe('Стейк Рибай', 'Растительное масло',  20, 'мл');

    // Паста Карбонара
    await addRecipe('Паста Карбонара', 'Спагетти',   150, 'г');
    await addRecipe('Паста Карбонара', 'Сливки 33%', 100, 'мл');
    await addRecipe('Паста Карбонара', 'Бекон',       80, 'г');

    // Тирамису
    await addRecipe('Тирамису', 'Маскарпоне', 150, 'г');
    await addRecipe('Тирамису', 'Яйца',         2, 'шт');
    await addRecipe('Тирамису', 'Сахар',        50, 'г');

    // Капучино
    await addRecipe('Капучино', 'Кофе зерно', 18,  'г');
    await addRecipe('Капучино', 'Молоко',     150, 'мл');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (client) client.release();
  }
};
