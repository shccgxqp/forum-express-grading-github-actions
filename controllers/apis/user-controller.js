const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const db = require('../../models')
const { User } = db

const userController = {
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password

      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  signUp: (req, res, next) => {
    try {
      if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')
      User.findOne({ where: { email: req.body.email } })
        .then(user => {
          if (user) {
            res.status(400).json({
              status: 'error',
              message: 'Email already exists!'
            })
          } else {
            return bcrypt.hash(req.body.password, 10)
              .then(hash => User.create({
                name: req.body.name,
                email: req.body.email,
                password: hash
              }))
              .then(user => {
                const userData = user.toJSON()
                delete userData.password

                const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })

                res.json({
                  status: 'success',
                  data: {
                    token,
                    user: userData
                  }
                })
              })
          }
        })
    } catch (err) {
      next(err)
    }
  }
}
module.exports = userController
