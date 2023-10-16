const commentServices = require('../../services/comment-services')

const commentController = {
  postComment: (req, res, next) => {
    commentServices.postComment(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', '評論新增成功')
      req.session.newComment = data
      res.redirect(`/restaurants/${data.comment.restaurantId}`)
    })
  },
  deleteComment: (req, res, next) => {
    commentServices.deleteComment(req, (err, data) => {
      if (err) return next(err)
      req.flash('success_messages', '評論刪除成功')
      req.session.newComment = data
      res.redirect(`/restaurants/${data.comment.restaurantId}`)
    })
  }
}
module.exports = commentController
