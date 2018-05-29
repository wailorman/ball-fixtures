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
    // associations can be defined here
  };
  return Post;
};
