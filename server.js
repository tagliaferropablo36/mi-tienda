const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. Conexión a la base de datos
const dbPath = path.join(__dirname, 'tienda.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// 2. Crear tabla y datos de prueba si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT,
        precio REAL NOT NULL,
        img TEXT
    )`, () => {
        db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO productos (nombre, categoria, precio, img) VALUES 
                    ('Smartphone Pro Max', 'Tecnología', 850, 'https://via.placeholder.com/150/5DADE2/FFFFFF?text=Celular'),
                    ('Perfume Elegance', 'Perfumes', 120, 'https://via.placeholder.com/150/F2F3F4/5DADE2?text=Perfume')`);
            }
        });
    });
});

// 3. RUTA PRINCIPAL EXPLÍCITA (Aquí es donde obligamos a Node a entregar el HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'tienda.html')); // O 'index.html' según cómo lo hayas nombrado
});
});

// 4. API de productos
app.get('/api/productos', (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 5. Encender servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
