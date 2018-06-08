/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const UserInfo = sequelize.define(
    'UserInfo',
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {},
  );
  UserInfo.associate = function (models) {
    UserInfo.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'User',
    });
  };
  return UserInfo;
};
