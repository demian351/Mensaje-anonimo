const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://testuser:test123@cluster0.rzbqtvy.mongodb.net/fccmessageboard?retryWrites=true&w=majority&appName=Cluster0';

console.log('Probando conexión directa...');

mongoose.connect(connectionString)
  .then(() => {
    console.log('✅ ¡CONECTADO CON ÉXITO!');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('Código:', err.code);
    process.exit(1);
  });