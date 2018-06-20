/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    'Tag',
    {
      name: DataTypes.STRING,
    },
    {},
  );
  Tag.associate = function (models) {
    Tag.belongsToMany(models.Post, {
      through: 'TagPost',
      foreignKey: 'tagId',
      as: 'Posts',
    });
  };
  return Tag;
};
