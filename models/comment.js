module.exports = function (sequelize, DataTypes) {
  const Comment = sequelize.define(
    'Comment',
    {
      body: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      postId: DataTypes.INTEGER,
    },
    {
      classMethods: {
        associate(models) {
          Comment.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'User',
          });

          Comment.belongsTo(models.Post, {
            foreignKey: 'postId',
            as: 'Post',
          });
        },
      },
    },
  );
  return Comment;
};
