/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const TagPost = sequelize.define(
    'TagPost',
    {
      tagId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    {},
  );
  TagPost.associate = function (models) {
  };
  return TagPost;
};
