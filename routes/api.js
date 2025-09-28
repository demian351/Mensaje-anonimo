'use strict';
const mongoose = require('mongoose');

// ============================================
// SCHEMAS DE MONGO
// ============================================

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

// ============================================
// RUTAS DE LA API
// ============================================

module.exports = function (app) {
  
  // ============================================
  // RUTAS PARA /api/threads/:board
  // ============================================
  
  // POST - Crear nuevo thread
  app.post('/api/threads/:board', async (req, res) => {
    try {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      
      const newThread = new Thread({
        board,
        text,
        delete_password,
        replies: []
      });
      
      await newThread.save();
      
      // Redirigir al board (según especificaciones de FCC)
      res.redirect(`/b/${board}/`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating thread');
    }
  });
  
  // GET - Ver los 10 threads más recientes con 3 replies cada uno
  app.get('/api/threads/:board', async (req, res) => {
    try {
      const board = req.params.board;
      
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-delete_password -reported')
        .lean();
      
      // Limitar replies a 3 y ocultar campos sensibles
      threads.forEach(thread => {
        thread.replies = thread.replies
          .slice(-3)
          .map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }));
      });
      
      res.json(threads);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching threads');
    }
  });
  
  // DELETE - Eliminar thread con password
  app.delete('/api/threads/:board', async (req, res) => {
    try {
      const { thread_id, delete_password } = req.body;
      
      const thread = await Thread.findById(thread_id);
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      if (thread.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting thread');
    }
  });
  
  // PUT - Reportar thread
  app.put('/api/threads/:board', async (req, res) => {
    try {
      const { thread_id } = req.body;
      
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      
      res.send('reported');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error reporting thread');
    }
  });
  
  // ============================================
  // RUTAS PARA /api/replies/:board
  // ============================================
  
  // POST - Crear nueva reply
  app.post('/api/replies/:board', async (req, res) => {
    try {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      
      const thread = await Thread.findById(thread_id);
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      thread.replies.push({
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      });
      
      thread.bumped_on = new Date();
      await thread.save();
      
      // Redirigir al thread (según especificaciones de FCC)
      res.redirect(`/b/${board}/${thread_id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating reply');
    }
  });
  
  // GET - Ver un thread completo con todas sus replies
  app.get('/api/replies/:board', async (req, res) => {
    try {
      const { thread_id } = req.query;
      
      const thread = await Thread.findById(thread_id)
        .select('-delete_password -reported')
        .lean();
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      // Ocultar campos sensibles de las replies
      thread.replies = thread.replies.map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      }));
      
      res.json(thread);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching thread');
    }
  });
  
  // DELETE - Eliminar reply con password
  app.delete('/api/replies/:board', async (req, res) => {
    try {
      const { thread_id, reply_id, delete_password } = req.body;
      
      const thread = await Thread.findById(thread_id);
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      const reply = thread.replies.id(reply_id);
      
      if (!reply) {
        return res.send('reply not found');
      }
      
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      // Cambiar el texto a "[deleted]" en lugar de eliminar
      reply.text = '[deleted]';
      await thread.save();
      
      res.send('success');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting reply');
    }
  });
  
  // PUT - Reportar reply
  app.put('/api/replies/:board', async (req, res) => {
    try {
      const { thread_id, reply_id } = req.body;
      
      const thread = await Thread.findById(thread_id);
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      const reply = thread.replies.id(reply_id);
      
      if (reply) {
        reply.reported = true;
        await thread.save();
      }
      
      res.send('reported');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error reporting reply');
    }
  });
  
};