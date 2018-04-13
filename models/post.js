module.exports = function (sequelize, DataTypes) {
  const Post = sequelize.define(
    'Post',
    {
      title: DataTypes.STRING,
      body: DataTypes.STRING,
    },
    {
      classMethods: {
        associate(models) {
          Post.belongsToMany(models.User, {
            foreignKey: 'postId',
            through: 'Authorship',
            as: 'Users',
          });

          Post.hasMany(models.Comment, {
            foreignKey: 'postId',
            as: 'Comments',
          });
        },
      },
    },
  );
  return Post;
};
