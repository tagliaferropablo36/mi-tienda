const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Sirve el index.html y assets desde la raíz

// Conexión a la Base de Datos SQLite
const dbFile = path.join(__dirname, 'tienda.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas iniciales si no existen
db.serialize(() => {
    // Tabla de Productos
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT
    )`);

    // Tabla de Usuarios (para Login y Admin)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT DEFAULT 'cliente'
    )`);

    // Insertar productos de prueba si la tabla está vacía
    
db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
    if (row.count === 0) {
        db.run(`INSERT INTO productos (nombre, categoria, precio, imagen) VALUES 
            ('Smartphone Pro Max', 'Tecnología', 850, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300'),
            ('Perfume Elegance', 'Perfumes', 120, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300'),
            ('Auriculares Inalámbricos', 'Tecnología', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'),
            ('Perfume Midnight', 'Perfumes', 85, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300')`);
        console.log('Productos con imágenes de prueba insertados.');
    }
});
// --- RUTAS DE LA API ---

// 1. Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 2. Agregar un producto (Panel de Administrador)
app.post('/api/productos', (req, res) => {
    const { nombre, categoria, precio } = req.body;
    db.run(`INSERT INTO productos (nombre, categoria, precio) VALUES (?, ?, ?)`, [nombre, categoria, precio], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, nombre, categoria, precio });
    });
});

// 3. Ruta de Inicio de Sesión (Login)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
        res.json({ success: true, rol: user.rol, email: user.email });
    });
});

// Ruta principal para servir el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
