const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendDeleteEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
})

router.patch('/users/me', auth, async (req, res) => {
  const { user, body } = req;
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const updates = Object.keys(body);
  const isValidOp = updates.every(update => allowedUpdates.includes(update))

  if (!isValidOp) {
    return res.status(400).send({ error: 'Invalid updates'})
  }

  try {
    updates.forEach(update => user[update] = body[update]);

    await user.save();
    
    res.send(user);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendDeleteEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post('/users/logout', auth, async (req, res) => {
  const { tokens } = req.user;
  try {
    req.user.tokens = tokens.filter(token => req.token !== token.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send('Successfully logged out of all sessions!');
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload jpg, jpeg or png file!'));
    }
    return cb(undefined, true);
  }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer)
  .png()
  .resize({ width: 250, height: 250})
  .toBuffer()
  req.user.avatar = buffer;
  await req.user.save();
  res.send()
}, (err, req, res, next) => {
  res.status(400).send({ error: err.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Avatar successfully deleted');
  } catch (e) {
    res.status(404).send();
  }
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
})

module.exports = router;