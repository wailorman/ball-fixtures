/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      name: DataTypes.STRING,
    },
    {},
  );
  User.associate = function (models) {
    User.hasOne(models.UserInfo, {
      foreignKey: 'userId',
      as: 'UserInfo',
    });
    User.hasMany(models.Post, {
      foreignKey: 'userId',
      as: 'Posts',
    });
  };
  return User;
};
