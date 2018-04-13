module.exports = function (sequelize, DataTypes) {
  const UserInfo = sequelize.define(
    'UserInfo',
    {
      telephone: DataTypes.STRING,
      address: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      classMethods: {
        associate(models) {
          UserInfo.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'User',
          });
        },
      },
    },
  );
  return UserInfo;
};
