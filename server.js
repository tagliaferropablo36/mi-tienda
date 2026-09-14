
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static(__dirname));

// Conexión a SQLite
const dbFile = path.join(__dirname, 'tienda.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error("Error al abrir la BD", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
    }
});

// Crear tablas e insertar productos y admin iniciales si está vacío
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
        // Verificar e insertar productos de prueba
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

        // Crear un usuario Administrador por defecto si no existe
        db.get(`SELECT * FROM usuarios WHERE email = ?`, ['admin@tienda.com'], (err, row) => {
            if (!row) {
                db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`, 
                    ['Administrador', 'admin@tienda.com', 'admin123', 'admin'], (err) => {
                    if (!err) console.log("Usuario Administrador creado (Email: admin@tienda.com / Pass: admin123)");
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

// Solo permitir agregar productos si es administrador (puedes validar por el rol o cabecera)
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
                    rol: row.rol // Devuelve si es 'admin' o 'cliente'
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

// Iniciar servidor en el puerto 4000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
=======
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Sirve archivos estáticos desde la raíz

// Conexión a la Base de Datos SQLite
const dbFile = path.join(__dirname, 'tienda.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear tablas iniciales si no existen e insertar datos por defecto
db.serialize(() => {
    // Tabla de Productos con columna de imagen
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT
    )`);

    // Tabla de Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT DEFAULT 'cliente'
    )`);

    // Insertar productos de prueba con imágenes si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO productos (nombre, categoria, precio, imagen) VALUES 
                ('Smartphone Pro Max', 'Tecnología', 850, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'),
                ('Perfume Elegance', 'Perfumes', 120, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400'),
                ('Auriculares Inalámbricos', 'Tecnología', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
                ('Perfume Midnight', 'Perfumes', 85, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400')`);
            console.log('Productos de prueba con imágenes insertados.');
        }
    });

    // Insertar usuario Administrador por defecto si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO usuarios (email, password, rol) VALUES ('admin@tienda.com', '123456', 'admin')`);
            console.log('Usuario administrador creado (admin@tienda.com / 123456).');
        }
    });
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

// 2. Agregar un producto nuevo (Panel Admin)
app.post('/api/productos', (req, res) => {
    const { nombre, categoria, precio, imagen } = req.body;
    const imgFinal = imagen && imagen.trim() !== '' ? imagen : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

    db.run(`INSERT INTO productos (nombre, categoria, precio, imagen) VALUES (?, ?, ?, ?)`, 
    [nombre, categoria, precio, imgFinal], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, nombre, categoria, precio, imagen: imgFinal });
    });
});

// 3. Ruta de inicio de sesión (Login)
// ✅ CÓDIGO NUEVO Y SEGURO
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Lee las credenciales de las variables de entorno de Render
  const ADMIN_USER = process.env.ADMIN_USER || 'admin_por_defecto';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password_seguro';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: 'Bienvenido, Administrador' });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});
// Ruta principal para servir el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

