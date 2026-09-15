const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Conexión a la Base de Datos SQLite
const dbFile = path.join(__dirname, 'tienda.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error("Error al abrir la BD", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
    }
});

// Crear tablas e insertar datos iniciales
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        email TEXT UNIQUE,
        password TEXT,
        rol TEXT DEFAULT 'cliente'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        categoria TEXT,
        precio REAL,
        img TEXT
    )`, () => {
        // Productos de prueba
        db.get(`SELECT COUNT(*) as count FROM productos`, (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare(`INSERT INTO productos (nombre, categoria, precio, img) VALUES (?, ?, ?, ?)`);
                stmt.run("Smartphone Pro", "Tecnología", 699, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300");
                stmt.run("Perfume Elegance", "Belleza", 89, "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300");
                stmt.run("Audífonos Inalámbricos", "Tecnología", 129, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300");
                stmt.finalize();
                console.log("Productos de prueba insertados.");
            }
        });

        // Usuario Administrador por defecto
        db.get(`SELECT * FROM usuarios WHERE email = ?`, ['admin@tienda.com'], (err, row) => {
            if (!row) {
                db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`, 
                    ['Administrador', 'admin@tienda.com', '123456', 'admin'], (err) => {
                    if (!err) console.log("Usuario Administrador creado (Email: admin@tienda.com / Pass: 123456)");
                });
            }
        });
    });
});

// --- ENDPOINTS DE PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    db.all(`SELECT * FROM productos`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/productos', (req, res) => {
    const { nombre, categoria, precio, img } = req.body;
    const imagenFinal = img || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300';
    const categoriaFinal = categoria || 'General';

    db.run(`INSERT INTO productos (nombre, categoria, precio, img) VALUES (?, ?, ?, ?)`, 
        [nombre, categoriaFinal, precio, imagenFinal], function(err) {
        if (err) return res.status(500).json({ error: "Error al guardar el producto" });
        res.json({ mensaje: "Producto agregado con éxito", id: this.lastID });
    });
});

app.delete('/api/productos/:id', (req, res) => {
    db.run(`DELETE FROM productos WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: "Error al eliminar el producto" });
        res.json({ mensaje: "Producto eliminado correctamente" });
    });
});

// --- ENDPOINTS DE AUTENTICACIÓN Y ADMIN ---
app.post('/api/registro', (req, res) => {
    const { nombre, email, password } = req.body;
    db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'cliente')`, [nombre, email, password], function(err) {
        if (err) return res.status(400).json({ error: "El correo ya está registrado" });
        res.json({ mensaje: "Usuario registrado con éxito" });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (row) {
            res.json({ 
                mensaje: "Login exitoso", 
                usuario: { 
                    id: row.id, 
                    nombre: row.nombre, 
                    email: row.email, 
                    rol: row.rol 
                } 
            });
        } else {
            res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});