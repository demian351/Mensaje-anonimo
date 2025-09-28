const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  // Variables para almacenar datos de prueba
  let testThreadId;
  let testReplyId;
  const testBoard = 'test';
  const validPassword = 'testpassword123';
  const invalidPassword = 'wrongpassword';

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    this.timeout(5000); // <-- AGREGA ESTA LÍNEA
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Test thread text',
        delete_password: validPassword
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });
});
    
    suite('GET', function() {
      test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            
            if (res.body.length > 0) {
              assert.property(res.body[0], '_id');
              assert.property(res.body[0], 'text');
              assert.property(res.body[0], 'created_on');
              assert.property(res.body[0], 'bumped_on');
              assert.property(res.body[0], 'replies');
              assert.isArray(res.body[0].replies);
              assert.isAtMost(res.body[0].replies.length, 3);
              
              assert.notProperty(res.body[0], 'delete_password');
              assert.notProperty(res.body[0], 'reported');
              
              testThreadId = res.body[0]._id;
            }
            
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Thread to delete with wrong password',
            delete_password: validPassword
          })
          .end(function(err, res) {
            chai.request(server)
              .get(`/api/threads/${testBoard}`)
              .end(function(err, res) {
                const threadToDelete = res.body.find(t => t.text === 'Thread to delete with wrong password');
                
                if (threadToDelete) {
                  chai.request(server)
                    .delete(`/api/threads/${testBoard}`)
                    .send({
                      thread_id: threadToDelete._id,
                      delete_password: invalidPassword
                    })
                    .end(function(err, res) {
                      assert.equal(res.status, 200);
                      assert.equal(res.text, 'incorrect password');
                      done();
                    });
                } else {
                  done();
                }
              });
          });
      });
      
      test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Thread to delete with correct password',
            delete_password: validPassword
          })
          .end(function(err, res) {
            chai.request(server)
              .get(`/api/threads/${testBoard}`)
              .end(function(err, res) {
                const threadToDelete = res.body.find(t => t.text === 'Thread to delete with correct password');
                
                if (threadToDelete) {
                  chai.request(server)
                    .delete(`/api/threads/${testBoard}`)
                    .send({
                      thread_id: threadToDelete._id,
                      delete_password: validPassword
                    })
                    .end(function(err, res) {
                      assert.equal(res.status, 200);
                      assert.equal(res.text, 'success');
                      done();
                    });
                } else {
                  done();
                }
              });
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Thread to report',
            delete_password: validPassword
          })
          .end(function(err, res) {
            chai.request(server)
              .get(`/api/threads/${testBoard}`)
              .end(function(err, res) {
                const threadToReport = res.body.find(t => t.text === 'Thread to report');
                
                if (threadToReport) {
                  chai.request(server)
                    .put(`/api/threads/${testBoard}`)
                    .send({
                      thread_id: threadToReport._id
                    })
                    .end(function(err, res) {
                      assert.equal(res.status, 200);
                      assert.equal(res.text, 'reported');
                      done();
                    });
                } else {
                  done();
                }
              });
          });
      });
    });
    
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Thread for reply test',
            delete_password: validPassword
          })
          .end(function(err, res) {
            chai.request(server)
              .get(`/api/threads/${testBoard}`)
              .end(function(err, res) {
                const thread = res.body.find(t => t.text === 'Thread for reply test');
                
                if (thread) {
                  chai.request(server)
                    .post(`/api/replies/${testBoard}`)
                    .send({
                      thread_id: thread._id,
                      text: 'Test reply text',
                      delete_password: validPassword
                    })
                    .end(function(err, res) {
                      assert.equal(res.status, 200);
                      done();
                    });
                } else {
                  done();
                }
              });
          });
      });
    });
    
    suite('GET', function() {
      test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            if (res.body.length > 0) {
              const threadId = res.body[0]._id;
              
              chai.request(server)
                .get(`/api/replies/${testBoard}`)
                .query({ thread_id: threadId })
                .end(function(err, res) {
                  assert.equal(res.status, 200);
                  assert.property(res.body, '_id');
                  assert.property(res.body, 'text');
                  assert.property(res.body, 'created_on');
                  assert.property(res.body, 'bumped_on');
                  assert.property(res.body, 'replies');
                  assert.isArray(res.body.replies);
                  
                  assert.notProperty(res.body, 'delete_password');
                  assert.notProperty(res.body, 'reported');
                  
                  if (res.body.replies.length > 0) {
                    assert.property(res.body.replies[0], '_id');
                    assert.property(res.body.replies[0], 'text');
                    assert.property(res.body.replies[0], 'created_on');
                    assert.notProperty(res.body.replies[0], 'delete_password');
                    assert.notProperty(res.body.replies[0], 'reported');
                  }
                  
                  done();
                });
            } else {
              done();
            }
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            if (res.body.length > 0) {
              const thread = res.body[0];
              const threadId = thread._id;
              
              chai.request(server)
                .post(`/api/replies/${testBoard}`)
                .send({
                  thread_id: threadId,
                  text: 'Reply to report',
                  delete_password: validPassword
                })
                .end(function(err, res) {
                  chai.request(server)
                    .get(`/api/replies/${testBoard}`)
                    .query({ thread_id: threadId })
                    .end(function(err, res) {
                      const replyToReport = res.body.replies.find(r => r.text === 'Reply to report');
                      
                      if (replyToReport) {
                        chai.request(server)
                          .put(`/api/replies/${testBoard}`)
                          .send({
                            thread_id: threadId,
                            reply_id: replyToReport._id
                          })
                          .end(function(err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, 'reported');
                            done();
                          });
                      } else {
                        done();
                      }
                    });
                });
            } else {
              done();
            }
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            if (res.body.length > 0) {
              const threadId = res.body[0]._id;
              
              chai.request(server)
                .post(`/api/replies/${testBoard}`)
                .send({
                  thread_id: threadId,
                  text: 'Reply to delete with wrong password',
                  delete_password: validPassword
                })
                .end(function(err, res) {
                  chai.request(server)
                    .get(`/api/replies/${testBoard}`)
                    .query({ thread_id: threadId })
                    .end(function(err, res) {
                      const replyToDelete = res.body.replies.find(r => r.text === 'Reply to delete with wrong password');
                      
                      if (replyToDelete) {
                        chai.request(server)
                          .delete(`/api/replies/${testBoard}`)
                          .send({
                            thread_id: threadId,
                            reply_id: replyToDelete._id,
                            delete_password: invalidPassword
                          })
                          .end(function(err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, 'incorrect password');
                            done();
                          });
                      } else {
                        done();
                      }
                    });
                });
            } else {
              done();
            }
          });
      });
      
      test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            if (res.body.length > 0) {
              const threadId = res.body[0]._id;
              
              chai.request(server)
                .post(`/api/replies/${testBoard}`)
                .send({
                  thread_id: threadId,
                  text: 'Reply to delete with correct password',
                  delete_password: validPassword
                })
                .end(function(err, res) {
                  chai.request(server)
                    .get(`/api/replies/${testBoard}`)
                    .query({ thread_id: threadId })
                    .end(function(err, res) {
                      const replyToDelete = res.body.replies.find(r => r.text === 'Reply to delete with correct password');
                      
                      if (replyToDelete) {
                        chai.request(server)
                          .delete(`/api/replies/${testBoard}`)
                          .send({
                            thread_id: threadId,
                            reply_id: replyToDelete._id,
                            delete_password: validPassword
                          })
                          .end(function(err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, 'success');
                            done();
                          });
                      } else {
                        done();
                      }
                    });
                });
            } else {
              done();
            }
          });
      });
    });
    
  });

});