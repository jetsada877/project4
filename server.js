const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// กำหนดเส้นทางสำหรับการให้บริการไฟล์ static เช่น index.html
app.use(express.static(path.join(__dirname, 'public')));

// เส้นทางหลักที่ไปยัง index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูลและสร้างตาราง
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            fullName TEXT NOT NULL,
            password TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            details TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_date TEXT NOT NULL,
            month INTEGER NOT NULL,
            account_type TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL
        )
    `);

    console.log('Database and tables are ready.');
});

// ---------------------- USERS API ----------------------
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/users', (req, res) => {
    const { username, fullName, password } = req.body;
    if (!username || !fullName || !password) {
        res.status(400).json({ error: 'All fields are required.' });
        return;
    }
    db.run(
        `INSERT INTO users (username, fullName, password) VALUES (?, ?, ?)`,
        [username, fullName, password],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM users WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

// ---------------------- ACCOUNTS API ----------------------
app.get('/accounts', (req, res) => {
    db.all('SELECT * FROM accounts', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/accounts', (req, res) => {
    const { code, type, category, details } = req.body;
    if (!code || !type || !category) {
        res.status(400).json({ error: 'Code, Type, and Category are required.' });
        return;
    }
    db.run(
        `INSERT INTO accounts (code, type, category, details) VALUES (?, ?, ?, ?)`,
        [code, type, category, details || ''],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/accounts/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM accounts WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

// ---------------------- EXPENSES API ----------------------
app.get('/expenses', (req, res) => {
    const sql = 'SELECT * FROM expenses ORDER BY expense_date DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/expenses', (req, res) => {
    const { expenseDate, month, accountType, category, description, amount } = req.body;
    if (!expenseDate || !month || !accountType || !category || !amount) {
        res.status(400).json({ error: 'All fields are required.' });
        return;
    }
    const sql = 'INSERT INTO expenses (expense_date, month, account_type, category, description, amount) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [expenseDate, month, accountType, category, description, amount], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID });
    });
});

app.delete('/expenses/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM expenses WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Expense not found' });
        } else {
            res.json({ message: 'Expense deleted successfully' });
        }
    });
});

// API: ดึงข้อมูลค่าใช้จ่ายทั้งหมด
app.get('/expenses', (req, res) => {
    let { startDate, endDate, search } = req.query;
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    if (startDate) {
        sql += ` AND expense_date >= ?`;
    }
    if (endDate) {
        sql += ` AND expense_date <= ?`;
    }
    if (search) {
        sql += ` AND (account_type LIKE ? OR category LIKE ? OR description LIKE ?)`;
    }
    const params = [];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    if (search) {
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://192.168.1.149:${PORT}`);
});
