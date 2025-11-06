import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => (
  <div>
    HomePage Placeholder
    <Link to={"/admin"}>admin</Link>
  </div>
);
export default HomePage;
