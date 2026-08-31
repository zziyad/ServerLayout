# Optimized Database Usage Examples

## 🎯 **Why Generic Methods?**

The `optimized-db.js` file now provides **schema-agnostic** methods that work with **any table structure**. No more hardcoded table names or column references!

## 🚀 **Generic CRUD Operations**

### **1. SELECT Operations**
```javascript
// Get all users
const users = await db.optimized.select('User');

// Get user by email
const user = await db.optimized.select('User', {
  where: { email: 'user@example.com' },
  limit: 1
});

// Get users with specific columns
const users = await db.optimized.select('User', {
  columns: ['id', 'email', 'first_name'],
  where: { is_active: true },
  orderBy: 'created_at DESC',
  limit: 10,
  offset: 0
});

// With caching
const users = await db.optimized.select('User', {
  where: { status: 'active' },
  useCache: true,
  cacheTTL: 300000 // 5 minutes
});
```

### **2. INSERT Operations**
```javascript
// Simple insert
const newUser = await db.optimized.insert('User', {
  email: 'new@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

// Insert with specific returning columns
const result = await db.optimized.insert('User', userData, {
  returning: 'id, email'
});

// Insert with ON CONFLICT handling
const result = await db.optimized.insert('User', userData, {
  onConflict: '(email) DO UPDATE SET updated_at = NOW()'
});
```

### **3. UPDATE Operations**
```javascript
// Update user by ID
const updated = await db.optimized.update('User', 
  { first_name: 'Jane', updated_at: 'NOW()' },
  { id: 123 }
);

// Update multiple users
const updated = await db.optimized.update('User',
  { status: 'inactive' },
  { department: 'old_dept' }
);
```

### **4. DELETE Operations**
```javascript
// Delete user by ID
const deleted = await db.optimized.delete('User', { id: 123 });

// Delete multiple records
const deleted = await db.optimized.delete('User', { 
  status: 'inactive',
  created_at: '< 2023-01-01'
});
```

### **5. COUNT and EXISTS**
```javascript
// Count active users
const count = await db.optimized.count('User', { is_active: true });

// Check if user exists
const exists = await db.optimized.exists('User', { email: 'test@example.com' });
```

## 🔧 **Batch Operations**

### **Batch Insert**
```javascript
const users = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com', name: 'User 3' }
];

const results = await db.optimized.batchInsert('User', users);
```

### **Batch Update**
```javascript
const updates = [
  { id: 1, status: 'active' },
  { id: 2, status: 'inactive' },
  { id: 3, status: 'pending' }
];

const results = await db.optimized.batchUpdate('User', updates, 'id');
```

## 🎯 **Legacy Compatibility**

Your existing code continues to work unchanged:

```javascript
// This still works exactly the same
const user = await db.pg.row('User', ['id', 'email'], { id: 123 });
const newUser = await db.pg.insert('User', userData);
const updated = await db.pg.update('User', updates, { id: 123 });
const deleted = await db.pg.delete('User', { id: 123 });
```

## 🚀 **Advanced Features**

### **Prepared Statements (Optional)**
```javascript
// Initialize prepared statements for your application
await db.optimized.initializeApplicationStatements([
  { name: 'get_active_users', query: 'SELECT * FROM "User" WHERE is_active = true' },
  { name: 'get_user_by_email', query: 'SELECT * FROM "User" WHERE email = $1' }
]);

// Use prepared statements
const users = await db.optimized.executePrepared('get_active_users');
const user = await db.optimized.executePrepared('get_user_by_email', ['user@example.com']);
```

### **Transactions**
```javascript
await db.optimized.transaction(async (client) => {
  const user = await client.query('INSERT INTO "User" (...) VALUES (...) RETURNING *');
  const profile = await client.query('INSERT INTO "Profile" (...) VALUES (...) RETURNING *');
  return { user: user.rows[0], profile: profile.rows[0] };
});
```

### **Performance Monitoring**
```javascript
// Get database metrics
const metrics = db.optimized.getMetrics();
console.log('Pool status:', metrics.pool);
console.log('Cache stats:', metrics.cache);

// Get slow queries
const slowQueries = await db.optimized.getSlowQueries(10);

// Get index usage
const indexStats = await db.optimized.getIndexUsageStats();
```

## ✅ **Benefits of Generic Approach**

1. **Schema-Agnostic**: Works with any table structure
2. **No Hardcoding**: No table names or columns in the optimization layer
3. **Future-Proof**: Database changes don't break the optimization layer
4. **Consistent API**: Same methods work for all tables
5. **Backward Compatible**: Existing code continues to work
6. **Performance**: All operations benefit from connection pooling, caching, and monitoring

## 🎯 **Migration Strategy**

1. **Keep existing code**: All `db.pg.*` calls continue working
2. **Gradually adopt**: Use `db.optimized.*` for new features
3. **No rush**: Migrate when convenient
4. **Test thoroughly**: Generic methods are well-tested but verify your specific use cases

The optimization layer is now **completely generic** and will work with any database schema changes! 🚀
