/* eslint-disable no-unused-vars */

module.exports = (sequelize, DataTypes) => {
  const Orphan = sequelize.define(
    'Orphan',
    {
      name: DataTypes.STRING,
    },
    {},
  );
  Orphan.associate = function (models) {
  };
  return Orphan;
};
