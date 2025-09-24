'use strict';

const mongoose = require('mongoose');

module.exports = function (app) {

  // ---------- 📦 Conexión a Mongo ----------
  mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).catch(err => console.error("Mongo connection error:", err));

  // ---------- 📑 Schemas ----------
  const replySchema = new mongoose.Schema({
    text: String,
    created_on: Date,
    delete_password: String,
    reported: { type: Boolean, default: false }
  });

  const threadSchema = new mongoose.Schema({
    board: String,
    text: String,
    created_on: Date,
    bumped_on: Date,
    reported: { type: Boolean, default: false },
    delete_password: String,
    replies: [replySchema]
  });

  // Evitar error "Cannot overwrite model once compiled"
  const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema);

  // ---------- 📝 THREADS ----------
  app.route('/api/threads/:board')
    // Crear un nuevo thread
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;

        const newThread = new Thread({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        await newThread.save();
        // FCC espera redirect a la página del board
        res.redirect(`/b/${board}/`);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Obtener los 10 threads más recientes con 3 replies
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        threads.forEach(t => {
          t.replies = t.replies.slice(-3);
          delete t.delete_password;
          delete t.reported;
          t.replies.forEach(r => {
            delete r.delete_password;
            delete r.reported;
          });
        });

        res.json(threads);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Borrar thread
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('thread not found');
        if (thread.delete_password !== delete_password) return res.send('incorrect password');

        await Thread.findByIdAndDelete(thread_id);
        res.send('success');
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Reportar thread
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('thread not found');

        thread.reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });

  // ---------- 📝 REPLIES ----------
  app.route('/api/replies/:board')
    // Crear reply
    .post(async (req, res) => {
      try {
        const { text, delete_password, thread_id } = req.body;

        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('thread not found');

        const reply = {
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        };

        thread.replies.push(reply);
        thread.bumped_on = new Date();
        await thread.save();

        // FCC espera redirect a la página del thread
        res.redirect(`/b/${req.params.board}/${thread_id}/`);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Obtener un thread con todos sus replies
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        const thread = await Thread.findById(thread_id).lean();
        if (!thread) return res.send('thread not found');

        delete thread.delete_password;
        delete thread.reported;
        thread.replies.forEach(r => {
          delete r.delete_password;
          delete r.reported;
        });

        res.json(thread);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Borrar reply
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('reply not found');
        if (reply.delete_password !== delete_password) return res.send('incorrect password');

        reply.text = '[deleted]';
        await thread.save();
        res.send('success');
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    })

    // Reportar reply
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('thread not found');

        const reply = thread.replies.id(reply_id);
        if (!reply) return res.send('reply not found');

        reply.reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });

};
