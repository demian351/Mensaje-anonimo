'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// ---------- Helmet (lo justo que pide FCC) ----------
app.use(helmet.frameguard({ action: 'sameorigin' }));   // evita clickjacking — Test 2
app.use(helmet.dnsPrefetchControl({ allow: false }));   // desactiva DNS prefetch — Test 3
app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // referrer solo same-origin — Test 4
// -----------------------------------------------------

// Archivos estáticos
app.use('/public', express.static(process.cwd() + '/public'));

// CORS (permitido para los tests FCC)
app.use(cors({ origin: '*' }));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas de testing de FCC
fccTestingRoutes(app);

// Rutas de la API (implementaremos en routes/api.js)
apiRoutes(app);

// Página principal
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);

  // Si estamos en modo test, corremos los tests después de un timeout
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (err) {
        console.log('Tests are not valid:');
        console.error(err);
      }
    }, 1500); // tiempo para que todo esté estable
  }
});

module.exports = app; // necesario para chai-http en tests
