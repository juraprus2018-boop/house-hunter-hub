import { Link } from "react-router-dom";
import { cityPath } from "@/lib/cities";

const popularCities = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Arnhem", "Haarlem", "Enschede", "Apeldoorn", "Amersfoort",
  "Leiden", "Delft", "Maastricht", "Zwolle", "Deventer",
];

const CitySkyline = () => {
  return (
    <section className="relative bg-primary overflow-hidden">
      {/* Skyline SVG */}
      <div className="relative">
        <svg
          viewBox="0 0 1440 160"
          className="w-full h-auto text-primary block"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sky background */}
          <rect width="1440" height="160" fill="hsl(var(--secondary))" />
          
          {/* City skyline silhouette */}
          <g fill="currentColor">
            {/* Buildings layer */}
            <rect x="0" y="100" width="1440" height="60" />
            
            {/* Individual buildings */}
            <rect x="20" y="70" width="18" height="90" rx="1" />
            <rect x="45" y="80" width="12" height="80" rx="1" />
            <rect x="62" y="55" width="22" height="105" rx="1" />
            <rect x="90" y="75" width="15" height="85" rx="1" />
            <rect x="112" y="40" width="8" height="120" rx="1" />
            <rect x="125" y="60" width="30" height="100" rx="1" />
            <rect x="160" y="85" width="20" height="75" rx="1" />
            <rect x="185" y="50" width="25" height="110" rx="1" />
            <rect x="215" y="70" width="16" height="90" rx="1" />
            <rect x="240" y="35" width="10" height="125" rx="1" />
            
            {/* Church/tower */}
            <rect x="260" y="25" width="6" height="135" rx="1" />
            <polygon points="263,15 255,35 271,35" />
            
            <rect x="280" y="65" width="28" height="95" rx="1" />
            <rect x="315" y="80" width="14" height="80" rx="1" />
            <rect x="335" y="55" width="20" height="105" rx="1" />
            <rect x="362" y="75" width="18" height="85" rx="1" />
            <rect x="385" y="45" width="12" height="115" rx="1" />
            
            {/* Trees */}
            <circle cx="405" cy="85" r="10" />
            <rect x="403" y="85" width="4" height="15" />
            <circle cx="425" cy="80" r="12" />
            <rect x="423" y="80" width="4" height="20" />
            
            <rect x="445" y="60" width="24" height="100" rx="1" />
            <rect x="475" y="40" width="8" height="120" rx="1" />
            <rect x="490" y="70" width="30" height="90" rx="1" />
            <rect x="525" y="85" width="16" height="75" rx="1" />
            <rect x="548" y="50" width="22" height="110" rx="1" />
            <rect x="575" y="75" width="18" height="85" rx="1" />
            
            {/* Windmill */}
            <rect x="600" y="55" width="6" height="105" rx="1" />
            <line x1="603" y1="55" x2="583" y2="40" stroke="currentColor" strokeWidth="3" />
            <line x1="603" y1="55" x2="623" y2="40" stroke="currentColor" strokeWidth="3" />
            <line x1="603" y1="55" x2="603" y2="30" stroke="currentColor" strokeWidth="3" />
            <line x1="603" y1="55" x2="590" y2="70" stroke="currentColor" strokeWidth="3" />
            
            <rect x="630" y="65" width="26" height="95" rx="1" />
            <rect x="662" y="80" width="14" height="80" rx="1" />
            <rect x="682" y="55" width="20" height="105" rx="1" />
            
            {/* Trees */}
            <circle cx="715" cy="82" r="11" />
            <rect x="713" y="82" width="4" height="18" />
            <circle cx="738" cy="78" r="13" />
            <rect x="736" y="78" width="4" height="22" />
            
            <rect x="758" y="45" width="10" height="115" rx="1" />
            <rect x="775" y="70" width="28" height="90" rx="1" />
            <rect x="810" y="60" width="16" height="100" rx="1" />
            <rect x="832" y="75" width="22" height="85" rx="1" />
            <rect x="860" y="50" width="18" height="110" rx="1" />
            <rect x="885" y="85" width="12" height="75" rx="1" />
            <rect x="902" y="65" width="26" height="95" rx="1" />
            
            {/* Tower */}
            <rect x="935" y="30" width="8" height="130" rx="1" />
            <polygon points="939,20 932,38 946,38" />
            
            <rect x="952" y="70" width="20" height="90" rx="1" />
            <rect x="978" y="80" width="14" height="80" rx="1" />
            <rect x="998" y="55" width="24" height="105" rx="1" />
            
            {/* Trees */}
            <circle cx="1035" cy="80" r="12" />
            <rect x="1033" y="80" width="4" height="20" />
            
            <rect x="1055" y="65" width="18" height="95" rx="1" />
            <rect x="1080" y="45" width="10" height="115" rx="1" />
            <rect x="1095" y="75" width="28" height="85" rx="1" />
            <rect x="1130" y="60" width="16" height="100" rx="1" />
            <rect x="1152" y="80" width="22" height="80" rx="1" />
            <rect x="1180" y="50" width="14" height="110" rx="1" />
            <rect x="1200" y="70" width="20" height="90" rx="1" />
            <rect x="1225" y="85" width="18" height="75" rx="1" />
            <rect x="1250" y="55" width="24" height="105" rx="1" />
            <rect x="1280" y="75" width="12" height="85" rx="1" />
            <rect x="1300" y="45" width="8" height="115" rx="1" />
            <rect x="1315" y="65" width="26" height="95" rx="1" />
            <rect x="1348" y="80" width="16" height="80" rx="1" />
            <rect x="1370" y="55" width="20" height="105" rx="1" />
            <rect x="1398" y="75" width="22" height="85" rx="1" />
            <rect x="1425" y="85" width="15" height="75" rx="1" />
          </g>
        </svg>
      </div>
      
      {/* Cities links */}
      <div className="container py-6">
        <p className="mb-4 text-center text-sm font-semibold text-primary-foreground/80">
          Zoek hier in de meest populaire plaatsen
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularCities.map((city) => (
            <Link
              key={city}
              to={cityPath(city)}
              className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CitySkyline;
