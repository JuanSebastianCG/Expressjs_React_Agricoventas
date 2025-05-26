// Create admin user
db = db.getSiblingDB('admin');
db.createUser({
  user: 'mongoAdmin',
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || 'adminPassword',
  roles: [{ role: 'root', db: 'admin' }]
});

// Create application database and user
db = db.getSiblingDB('agricoventas');
db.createUser({
  user: process.env.MONGO_INITDB_USERNAME || 'agricoventasUser',
  pwd: process.env.MONGO_INITDB_PASSWORD || 'agricoventasPassword',
  roles: [
    { role: 'readWrite', db: 'agricoventas' },
    { role: 'dbAdmin', db: 'agricoventas' }
  ]
});

// Create initial collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('orders');
db.createCollection('locations');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.products.createIndex({ "sellerId": 1 });
db.products.createIndex({ "categoryId": 1 });
db.orders.createIndex({ "buyerUserId": 1 });
db.categories.createIndex({ "name": 1 }, { unique: true }); 