/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const CrossLinkTwo = sequelize.define(
    'CrossLinkTwo',
    {
      name: DataTypes.STRING,
      crossLinkOneId: DataTypes.INTEGER,
    },
    {},
  );
  CrossLinkTwo.associate = function (models) {
    CrossLinkTwo.belongsTo(models.CrossLinkOne, {
      foreignKey: 'crossLinkOneId',
      as: 'ParentCrossLinkOne',
    });

    CrossLinkTwo.hasMany(models.CrossLinkOne, {
      foreignKey: 'crossLinkOneId',
      as: 'ChildCrossLinkOnes',
    });
  };
  return CrossLinkTwo;
};
