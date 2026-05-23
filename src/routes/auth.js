const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profile_photo'), updateProfile);
router.delete('/account', protect, deleteAccount);

module.exports = router;
