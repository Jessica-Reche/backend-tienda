const express = require('express');
const router = express.Router();
const { login, authenticate, register, deleteUser, updateUser, getUsers } = require('../controllers/user.controller');
const auth = require('../middlewares/authMiddleware');

//Routes for the user
router
    .get('/authenticate', authenticate)
    .get('/users', auth, getUsers)
    .post('/login', login)
    .post('/register', register)
    .delete('/deleteUser/:id', auth, deleteUser)
    .put('/updateUser', auth, updateUser)

module.exports = router;


