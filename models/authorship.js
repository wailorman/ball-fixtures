module.exports = function (sequelize, DataTypes) {
  const Authorship = sequelize.define(
    'Authorship',
    {
      userId: DataTypes.INTEGER,
      postId: DataTypes.INTEGER,
    },
    {
      classMethods: {
        // associate(models) {
        //   // associations can be defined here
        // },
      },
    },
  );
  return Authorship;
};
