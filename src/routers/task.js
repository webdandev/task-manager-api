const express = require('express')
const multer = require('multer')
const Task = require('../models/task')
const router = new express.Router()
const auth = require('../middleware/auth')
const sharp = require('sharp')
const { findOne } = require('../models/task')

router.post('/tasks', auth, async (req, res) => { 
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })  

  try {
    await task.save()
    res.status(201).send(task)
  } catch(e) {
    res.status(400).send(e)
  }
})

// GET //tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt_desc

router.get('/tasks', auth, async (req, res) => { 
  const match = {}
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":")
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {    
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
      }).execPopulate()

    res.send(req.user.tasks)
  } catch(e) {
    res.status(500).send()
  }  
})

router.get('/tasks/:id', auth, async (req,res) => {
  const _id = req.params.id  
  
  try {    
    const task = await Task.findOne( {_id, owner: req.user._id} )

    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch(e) {
    res.status(500).send()
  }    
})

router.patch('/tasks/:id', auth, async (req, res) => {
    
  const updates = Object.keys(req.body)
  const allowedUpdates = ['description', 'completed']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates!'})
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })  
    
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
    
    if (!task) {
      return res.status(404).send()
    }
    updates.forEach((update) => task[update] = req.body[update])
    await task.save()
    res.send(task)

  } catch(e) {  
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id:req.params.id, owner: req.user._id})
 
    if(!task) {
      return res.status(404).send()
    }
    res.send(task)

  } catch (e) {
    res.status(500).send()
  }  
})

const upload = multer({
  limits: {
    fileSize: 2000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please uplode an image'))
    }

    cb(undefined, true)
  }
})

router.post('/tasks/:id', auth, upload.single('picture'), async(req, res) => {  
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
  
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    task.picture = buffer
    await task.save()
    res.send(task)
  } catch(e) {
    res.status(400).send(e)
  }
},(error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/tasks/:id/picture', auth, async (req, res) => {
  try {
    const task = await Task.findById({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      res.status(404).send()
    }
    task.picture = undefined
    await task.save()
    res.send()
  } catch(e) {
    res.status(400).send(e)
  }  
})

router.get('/tasks/:id/picture', async(req, res) => {
  try {
    const task = await Task.findById( {_id: req.params.id })
    if (!task || !task.picture) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(task.picture)

  } catch (e) {
    res.status(404).send()
  }
})


module.exports = router
