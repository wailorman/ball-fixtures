/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const SelfLinked = sequelize.define(
    'SelfLinked',
    {
      name: DataTypes.STRING,
      selfLinkedId: DataTypes.INTEGER,
    },
    {},
  );
  SelfLinked.associate = function (models) {
    SelfLinked.belongsTo(SelfLinked, {
      foreignKey: 'selfLinkedId',
      as: 'ParentSelfLinked',
    });

    SelfLinked.hasMany(SelfLinked, {
      foreignKey: 'selfLinkedId',
      as: 'ChildSelfLinkeds',
    });
  };
  return SelfLinked;
};
