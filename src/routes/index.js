const express = require('express');
const exampleRoute = require('./example.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/examples',
    route: exampleRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
