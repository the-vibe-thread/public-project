// Place this in your loader component file
import "./LogoLoader.css";
import logo from "./loader.png"; // Place your PNG in the same folder and use the correct path

export default function LogoLoader() {
  return (
    <div className="logo-loader">
      <img src={logo} alt="Loading..." className="logo-loader-img" />
    </div>
  );
}