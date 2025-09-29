'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const app = express();

// ============================================
// SEGURIDAD CON HELMET
// ============================================
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors({ origin: '*' })); // FCC requiere CORS habilitado
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// ============================================
// CONEXIÓN A MONGODB (SIN OPCIONES DEPRECADAS)
// ============================================
mongoose.connect(process.env.DB)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// ============================================
// RUTAS API
// ============================================
const apiRoutes = require('./routes/api.js');
apiRoutes(app);

// ============================================
// RUTAS PARA FRONTEND (HTML)
// ============================================
app.route('/b/:board/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/board.html');
  });

app.route('/b/:board/:threadid')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

// Index page (home page)
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// ============================================
// 404 NOT FOUND
// ============================================
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// ============================================
// PUERTO
// ============================================
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 App escuchando en puerto ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('⚠️  Modo TEST activado');
  }
});

module.exports = app; // Para los tests de FCC