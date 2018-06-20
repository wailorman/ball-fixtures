/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const CrossLinkOne = sequelize.define(
    'CrossLinkOne',
    {
      name: DataTypes.STRING,
      crossLinkTwoId: DataTypes.INTEGER,
    },
    {},
  );
  CrossLinkOne.associate = function (models) {
    CrossLinkOne.belongsTo(models.CrossLinkTwo, {
      foreignKey: 'crossLinkTwoId',
      as: 'ParentCrossLinkTwo',
    });

    CrossLinkOne.hasMany(models.CrossLinkTwo, {
      foreignKey: 'crossLinkTwoId',
      as: 'ChildCrossLinkTwos',
    });
  };
  return CrossLinkOne;
};
