var express = require('express')
var router = express.Router()
var db = require('../models')
var isAuthenticated = require('./utils/isAuthenticated.js')

// Credit coins to student
var creditCoins = (studentUUID, coins) => {
  return new Promise((resolve, reject) => {
    db.Student.findOne({ where: { uuid: studentUUID } })
      .then(student => resolve(student.increment('coin_count', { by: coins })))
      .catch(err => reject(err))
  })
}

/**
 * API Path '/api/task'
 */

// Teacher creates new task for student
router.route('/new')
  // Assuming req body will be an array of task objects
  .post(isAuthenticated, (req, res, next) => {
    // Bulk update db
    db.Task.bulkCreate(req.body.queryArray)
      .then(() => res.status(201).send())
    res.status(200).send()
  })

// Student starts the timer (clicks `start` button)
router.route('/timer/start')
  .put((req, res, next) => {
    // Get task uuid from req body
    var uuid = req.body.uuid
    // Update task with start time (add 1 second to accomodate DB roundtrip)
    db.Task.update({ start_time: Date.now() + 1000 }, { where: { uuid } })
      .then(() => res.status(204).send())
  })

// Student stops the timer (clicks `done` button)
router.route('/timer/done')
  .put((req, res, next) => {
    // Get task uuid from req body
    var uuid = req.body.uuid
    // Find task
    db.Task.findOne({ where: { uuid } })
      // Credit coins to student associated with task
      .then(task => creditCoins(task.student_uuid, task.coin_value))
      // Update task with `is_done` boolean
      .then(() => db.Task.update({ is_done: true }, { where: { uuid } }))
      // Send success response to client
      .then(() => res.status(204).send())
  })

module.exports = router
