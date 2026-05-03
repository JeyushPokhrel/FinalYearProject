 
import logo from "../assets/logo.png";

export default function LogoBackground() {
  return (
    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
      <div className="grid grid-cols-6 gap-10 p-10">
        {Array.from({ length: 60 }).map((_, i) => (
          <img
            key={i}
            src={logo}
            alt="logo"
            className="w-16 h-16 object-contain opacity-70"
          />
        ))}
      </div>
    </div>
  );
}