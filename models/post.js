/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      title: DataTypes.STRING,
      body: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {},
  );
  Post.associate = function (models) {
    Post.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'Author',
    });
  };
  return Post;
};
