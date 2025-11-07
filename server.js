const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas exitosamente");
  })
  .catch((error) => {
    console.error("❌ Error conectando a MongoDB:", error);
  });

// Definir esquema de Usuario (basado en tu estructura real)
const usuarioSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  name: String,
  email: String,
  fechaCreacion: { type: Date, default: Date.now }
});
const Usuario = mongoose.model("Usuario", usuarioSchema, "Usuario");

// server.js (reemplaza tu schema de libro)
const libroSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, required: true },
  category: String,
  publishYear: Number,
  totalCopies: { type: Number, default: 1 },
  stock: { type: Number, default: 1 },
  description: String,
  coverImage: String,
  createdAt: { type: Date, default: Date.now }
});
const Libro = mongoose.model("Libro", libroSchema, "Libro");

const loanSchema = new mongoose.Schema({
  loanDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  status: { type: String, enum: ['active', 'returned', 'overdue'], default: 'active' },
  userId: { // Corregido de 'usuario_id'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  bookId: { // Corregido de 'libro_id'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Libro' // Corregido para referenciar al modelo 'Book'
  },
  createdAt: { type: Date, default: Date.now } // Añadido para coincidir con la interfaz
});
const Loan = mongoose.model("Prestamo", loanSchema, "Prestamo"); 
// ==============================
// ========== USUARIOS ==========
// ==============================

// Obtener lista de usuarios 
app.get('/api/users/list', async (req, res) => {
  try {
    const usuarios = await Usuario.find({ role: 'user' }).select('_id name username email');
    res.json({ success: true, users: usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});
// Crear nuevo usuario
app.post('/api/users', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    const guardarUsuario = await nuevoUsuario.save();
    res.status(201).json({ success: true, user: guardarUsuario });
  } catch (error) {
    if (error.code === 11000) { //generar mensaje
      return res.status(400).json({ success: false, message: 'El username o email ya existe.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});
// Actualizar usuario (para cambiar rol)
app.put('/api/users/:id', async (req, res) => {
  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!usuarioActualizado) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, user: usuarioActualizado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Eliminar usuario
app.delete('/api/users/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================
// ========== LIBROS ==========
// ============================

// Obtener todos los libros
app.get('/api/libros', async (req, res) => {
  try {
    const libros = await Libro.find();
    // Envía la clave "books" (plural) que el frontend espera
    res.json({ success: true, books: libros }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener un libro por ID
app.get('/api/libros/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id); // 'libros' a 'libro'
    if (!libro) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    }
    // Envía la clave "book" (singular) que el frontend espera
    res.json({ success: true, book: libro }); 
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener libro' });
  }
});

// Crear nuevo Libro
app.post('/api/libros', async (req, res) => {
  try {
    const nuevoLibro = new Libro(req.body);
    const guardarLibro = await nuevoLibro.save();
    // Envía la respuesta en el formato BookResponse
    res.status(201).json({ success: true, book: guardarLibro }); 
  } catch (error) {
        // 1. Revisa si el error es el código 11000 (duplicado)
    if (error.code === 11000) {
      // 2. Envía un error 400 (Bad Request) con el mensaje específico
      return res.status(400).json({ 
        success: false, 
        message: 'Error: El ISBN ya existe en la base de datos.' 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// Actualizar Libro
app.put('/api/libros/:id', async (req, res) => {
  try {
    const libroActualizado = await Libro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!libroActualizado) {
      return res.status(404).json({ success: false, message: 'Libro no encontrado' });
    }
    // Envía la respuesta en el formato BookResponse
    res.json({ success: true, book: libroActualizado }); 
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Eliminar Libro (Esta ruta ya estaba casi bien, solo ajustamos el error)
app.delete('/api/libros/:id', async (req, res) => {
  try {
    const deletedBook = await Libro.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(44).json({ success: false, message: 'Libro no encontrado' });
    }
    res.json({ success: true, message: 'Libro eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===============================
// ========== PRESTAMOS ==========
// ===============================

// Obtener todos los préstamos
app.get('/api/prestamos', async (req, res) => {
  try {
    const { userId, role } = req.query; // Corregido de 'usuario_id'
    const query = role === 'user' ? { userId } : {}; // Corregido a 'userId'
    
    const loans = await Loan.find(query) // Corregido a 'Loan'
      .populate('bookId') // Corregido de 'libro_id'
      .populate('userId', 'name username email'); // Corregido de 'usuario_id'
    
    res.json({ success: true, loans: loans }); // Estandarizado a 'loans'
  } catch (error) {
    console.error('Error al obtener préstamos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener préstamos' });
  }
});

// Crear un préstamo
app.post('/api/prestamos', async (req, res) => {
  try {
    // Corregido a camelCase para coincidir con el frontend
    const { bookId, userId, dueDate } = req.body; 
    
    // Verificar que existan libro y usuario
    const libro = await Libro.findById(bookId); // Corregido de 'libro_id'
    const usuario = await Usuario.findById(userId); // Corregido de 'usuario_id'
    
    if (!libro) {
      return res.status(400).json({ success: false, message: 'Libro no encontrado' });
    }
    
    if (!usuario) {
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    // Verificar disponibilidad del libro
    if (libro.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Libro no disponible' });
    }
    
    // Crear préstamo
    const newLoan = new Loan({ // Corregido a 'Loan'
      bookId, // Corregido
      userId, // Corregido
      dueDate: new Date(dueDate) // Corregido
    });
    await newLoan.save();
    
    // Actualizar copias disponibles
    libro.stock -= 1;
    await libro.save();
    
    // Obtener el préstamo con datos poblados
    await newLoan.populate('bookId');
    await newLoan.populate('userId', 'name username email');
    
    // Estandarizado a 'loan'
    res.json({ success: true, loan: newLoan }); 
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ success: false, message: 'Error al crear préstamo' });
  }
});

// Devolver un libro
app.put('/api/prestamos/:id/return', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id); // Corregido a 'Loan'
    
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
    }
    
    // Marcar como devuelto
    loan.returnDate = new Date(); // Corregido
    loan.status = 'returned'; // Corregido
    await loan.save();
    
    // Aumentar copias disponibles
    const libro = await Libro.findById(loan.bookId); // Corregido a 'bookId'
    if (libro) {
      libro.stock += 1;
      await libro.save();
    }
    
    // Obtener el préstamo actualizado con datos poblados
    await loan.populate('bookId');
    await loan.populate('userId', 'name username email');
    
    res.json({ success: true, loan: loan }); // Estandarizado a 'loan'
  } catch (error) {
    console.error('Error al devolver libro:', error);
    res.status(500).json({ success: false, message: 'Error al devolver libro' });
  }
});

// ===================================
// ========== Rutas básicas ==========
// ===================================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await Usuario.findOne({ username, password });
    
    if (user) {
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});