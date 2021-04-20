const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const { body, user} = req;

  const task = new Task({
    ...body,
    owner: user._id
  })

  try {
    await task.save();
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const match = {}
  const sort = {}
  const { completed = false, limit = 0, skip = 0, sortBy } = req.query;

  if (completed) {
    match.completed = completed === 'true';
  }

  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }
  
  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOne({ _id: id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task);
  } catch (e) {
    res.status(500).send()
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { user, body } = req;
  const allowedUpdates = ['description', 'completed'];
  const updates = Object.keys(req.body);
  const isValidOp = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOp) {
    return res.status(400).send({ error: 'Error'});
  }

  try {
    const task = await Task.findOne({ _id: id, owner: user._id});
    if (!task) {
      return res.status(400).send()
    }

    updates.forEach(update => task[update] = body[update]);
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id});
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send()
  }
});

module.exports = router;