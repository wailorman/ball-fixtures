module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      name: DataTypes.STRING,
    },
    {
      classMethods: {
        associate(models) {
          User.hasOne(models.UserInfo, {
            foreignKey: 'userId',
            as: 'UserInfo',
          });

          User.belongsToMany(models.Post, {
            through: 'Authorship',
            foreignKey: 'userId',
            as: 'Posts',
          });
        },
      },
    },
  );
  return User;
};
