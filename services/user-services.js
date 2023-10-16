const bcrypt = require('bcryptjs')
const { localFileHandler } = require('../helpers/file-helpers')

const db = require('../models')
const { User, Restaurant, Favorite, Like, Followship, Comment } = db

const userController = {
  signUp: (req, cb) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')

        return bcrypt.hash(req.body.password, 10)
          .then(hash => User.create({
            name: req.body.name,
            email: req.body.email,
            password: hash
          }))
          .then(user => {
            const userData = user.toJSON()
            delete userData.password
            req.flash('success_messages', '註冊成功!')
            return cb(null, { data: { user: userData } })
          })
      })
      .catch(err => cb(err))
  },
  getUser: (req, cb) => {
    return User.findByPk(req.params.id, {
      include: [{
        model: Comment, include: Restaurant
      }]
    })
      .then(user => {
        if (!user) throw new Error("User didn't exists!")
        user = user.toJSON()
        // 剔除相同餐廳
        const uniqueRestaurantMap = new Map()
        user.commentedRestaurants = user.Comments.reduce((acc, comment) => {
          const restaurantId = comment.restaurantId
          if (restaurantId !== null && !uniqueRestaurantMap.has(restaurantId)) {
            uniqueRestaurantMap.set(restaurantId, true)
            acc.push(comment.Restaurant)
          }
          return acc
        }, [])

        cb(null, { user })
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    const { name } = req.body
    const { file } = req
    return Promise.all([
      User.findByPk(req.params.id),
      localFileHandler(file)
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error('User name is required!')
        if (user.id !== req.user.id) throw new Error('只能更改自己的資料！')
        return user.update({
          name,
          image: filePath || user.image
        })
      })
      .then(editedUser => cb(null, { user: editedUser.toJSON() }))
      .catch(err => cb(err))
  },
  addFavorite: (req, cb) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')

        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(newFavorite => cb(null, { favorite: newFavorite.toJSON() }))
      .catch(err => cb(err))
  },
  removeFavorite: (req, cb) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy()
      })
      .then(deletedFavorite => cb(null, { favorite: deletedFavorite.toJSON() }))
      .catch(err => cb(err))
  },
  addLike: (req, cb) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error('You have liked this restaurant!')

        return Like.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(newLike => cb(null, { like: newLike.toJSON() }))
      .catch(err => cb(err))
  },
  removeLike: (req, cb) => {
    const { restaurantId } = req.params
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")

        return like.destroy()
      })
      .then(deletedLike => cb(null, { like: deletedLike.toJSON() }))
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    return User.findAll(
      {
        include: { model: User, as: 'Followers' }
      })
      .then(users => {
        users = users.map(
          user => ({ // 教案另外使用result存取陣列
            ...user.toJSON(),
            followerCount: user.Followers.length,
            isFollowed: req.user.Followings.some(f => f.id === user.id)
          })
        ).sort((user1, user2) => user2.followerCount - user1.followerCount)
        return cb(null, { users })
      })
      .catch(err => cb(err))
  },
  addFollowing: (req, cb) => {
    const { userId } = req.params
    return Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: { // 記得還是要where 才能同時滿足二條件
          followerId: req.user.id,
          followingId: userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      }).then(newFollowship => cb(null, { followship: newFollowship.toJSON() }))
      .catch(err => cb(err))
  },
  removeFollowing: (req, cb) => {
    return Followship.findOne({
      where: { // 記得where
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(deletedFollowship => cb(null, { followship: deletedFollowship.toJSON() }))
      .catch(err => cb(err))
  }

}
module.exports = userController
