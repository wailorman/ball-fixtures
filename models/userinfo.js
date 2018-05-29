/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const UserInfo = sequelize.define(
    'UserInfo',
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      userId: DataTypes.STRING,
    },
    {},
  );
  UserInfo.associate = function (models) {
    // associations can be defined here
  };
  return UserInfo;
};
