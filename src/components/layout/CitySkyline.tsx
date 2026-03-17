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
          viewBox="0 0 1440 200"
          className="w-full h-auto block"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sky background */}
          <rect width="1440" height="200" fill="hsl(var(--secondary))" />
          
          {/* City skyline silhouette */}
          <g fill="hsl(var(--primary))">
            {/* Base ground */}
            <rect x="0" y="140" width="1440" height="60" />

            {/* === Left section: Residential neighborhood === */}
            <rect x="8" y="118" width="10" height="22" rx="1" />
            <rect x="20" y="108" width="14" height="32" rx="1" />
            {/* Small house with roof */}
            <polygon points="27,108 18,118 36,118" />
            <rect x="38" y="114" width="10" height="26" rx="1" />
            <rect x="50" y="100" width="16" height="40" rx="1" />
            <polygon points="58,100 48,112 68,112" />
            <rect x="68" y="120" width="8" height="20" rx="1" />
            <rect x="78" y="105" width="12" height="35" rx="1" />
            
            {/* Apartment block */}
            <rect x="94" y="80" width="24" height="60" rx="1" />
            {/* Windows (negative space effect - small lighter rects) */}
            <rect x="120" y="110" width="10" height="30" rx="1" />
            <rect x="132" y="95" width="18" height="45" rx="1" />
            
            {/* Tree */}
            <circle cx="158" cy="122" r="9" />
            <rect x="156" y="128" width="4" height="12" />
            
            {/* Row houses */}
            <rect x="168" y="112" width="11" height="28" rx="1" />
            <polygon points="173.5,112 166,120 181,120" />
            <rect x="181" y="108" width="11" height="32" rx="1" />
            <polygon points="186.5,108 179,116 194,116" />
            <rect x="194" y="114" width="11" height="26" rx="1" />
            <polygon points="199.5,114 192,122 207,122" />
            
            {/* Tall apartment */}
            <rect x="210" y="65" width="20" height="75" rx="1" />
            <rect x="232" y="100" width="12" height="40" rx="1" />
            
            {/* Church with spire */}
            <rect x="248" y="75" width="18" height="65" rx="1" />
            <rect x="254" y="40" width="6" height="35" rx="1" />
            <polygon points="257,28 250,48 264,48" />
            
            <rect x="270" y="105" width="14" height="35" rx="1" />
            <rect x="286" y="95" width="10" height="45" rx="1" />

            {/* Tree pair */}
            <circle cx="306" cy="118" r="11" />
            <rect x="304" y="126" width="4" height="14" />
            <circle cx="324" cy="122" r="8" />
            <rect x="322" y="128" width="4" height="12" />

            {/* === Central-left: Mixed use === */}
            <rect x="336" y="90" width="22" height="50" rx="1" />
            <rect x="360" y="110" width="10" height="30" rx="1" />
            <rect x="372" y="78" width="16" height="62" rx="1" />
            <rect x="390" y="100" width="12" height="40" rx="1" />
            
            {/* Grachtenpand (canal house) - stepped gable */}
            <rect x="406" y="85" width="16" height="55" rx="1" />
            <rect x="408" y="80" width="12" height="5" />
            <rect x="410" y="76" width="8" height="4" />
            <rect x="412" y="73" width="4" height="3" />
            
            {/* Another canal house */}
            <rect x="424" y="82" width="16" height="58" rx="1" />
            <rect x="426" y="77" width="12" height="5" />
            <rect x="428" y="73" width="8" height="4" />
            <rect x="430" y="70" width="4" height="3" />
            
            {/* Canal house with neck gable */}
            <rect x="442" y="80" width="16" height="60" rx="1" />
            <rect x="446" y="68" width="8" height="12" />
            <polygon points="450,62 443,72 457,72" />
            
            <rect x="462" y="105" width="10" height="35" rx="1" />
            <rect x="474" y="92" width="18" height="48" rx="1" />
            
            {/* Tall modern tower */}
            <rect x="496" y="50" width="14" height="90" rx="1" />
            <rect x="499" y="44" width="8" height="6" />
            <rect x="501" y="38" width="4" height="6" />
            
            <rect x="514" y="108" width="12" height="32" rx="1" />
            <rect x="528" y="98" width="14" height="42" rx="1" />

            {/* Tree */}
            <circle cx="552" cy="120" r="10" />
            <rect x="550" y="128" width="4" height="12" />

            {/* === Center: Windmill === */}
            <rect x="568" y="115" width="10" height="25" rx="1" />
            <rect x="580" y="100" width="16" height="40" rx="1" />
            
            {/* Windmill */}
            <rect x="604" y="85" width="10" height="55" />
            <rect x="606" y="82" width="6" height="3" />
            {/* Windmill body - tapered */}
            <polygon points="604,140 614,140 612,85 606,85" />
            {/* Blades */}
            <line x1="609" y1="85" x2="584" y2="60" stroke="hsl(var(--primary))" strokeWidth="3" />
            <line x1="609" y1="85" x2="634" y2="60" stroke="hsl(var(--primary))" strokeWidth="3" />
            <line x1="609" y1="85" x2="609" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" />
            <line x1="609" y1="85" x2="590" y2="100" stroke="hsl(var(--primary))" strokeWidth="3" />
            {/* Blade tips */}
            <rect x="581" y="56" width="8" height="4" rx="1" transform="rotate(-40, 585, 58)" />
            <rect x="630" y="56" width="8" height="4" rx="1" transform="rotate(40, 634, 58)" />
            <rect x="606" y="50" width="6" height="5" rx="1" />
            <rect x="586" y="97" width="8" height="4" rx="1" transform="rotate(30, 590, 99)" />
            
            <rect x="626" y="108" width="14" height="32" rx="1" />
            <rect x="642" y="95" width="18" height="45" rx="1" />
            <rect x="662" y="112" width="10" height="28" rx="1" />
            
            {/* === Center-right: Downtown === */}
            {/* High-rise apartments */}
            <rect x="678" y="55" width="22" height="85" rx="1" />
            <rect x="702" y="75" width="14" height="65" rx="1" />
            <rect x="718" y="42" width="18" height="98" rx="2" />
            <rect x="722" y="36" width="10" height="6" />
            <rect x="725" y="30" width="4" height="6" />
            
            <rect x="738" y="88" width="12" height="52" rx="1" />
            <rect x="752" y="70" width="20" height="70" rx="1" />
            
            {/* Trees */}
            <circle cx="782" cy="118" r="10" />
            <rect x="780" y="126" width="4" height="14" />
            <circle cx="798" cy="122" r="8" />
            <rect x="796" y="128" width="4" height="12" />
            
            {/* Row of houses */}
            <rect x="812" y="110" width="12" height="30" rx="1" />
            <polygon points="818,110 810,118 826,118" />
            <rect x="826" y="106" width="12" height="34" rx="1" />
            <polygon points="832,106 824,114 840,114" />
            <rect x="840" y="112" width="12" height="28" rx="1" />
            <polygon points="846,112 838,120 854,120" />
            
            {/* Medium buildings */}
            <rect x="856" y="90" width="16" height="50" rx="1" />
            <rect x="874" y="100" width="10" height="40" rx="1" />
            
            {/* === Right section: More canal houses === */}
            {/* Canal house - bell gable */}
            <rect x="890" y="82" width="16" height="58" rx="1" />
            <path d="M892,82 Q898,72 906,82" fill="hsl(var(--primary))" />
            
            {/* Canal house - step gable */}
            <rect x="908" y="78" width="16" height="62" rx="1" />
            <rect x="910" y="73" width="12" height="5" />
            <rect x="912" y="69" width="8" height="4" />
            <rect x="914" y="66" width="4" height="3" />
            
            {/* Canal house - spout gable */}
            <rect x="926" y="80" width="16" height="60" rx="1" />
            <polygon points="934,74 926,82 942,82" />
            
            <rect x="944" y="105" width="12" height="35" rx="1" />
            <rect x="958" y="92" width="18" height="48" rx="1" />
            
            {/* Tower / Dom tower style */}
            <rect x="980" y="48" width="12" height="92" rx="1" />
            <rect x="983" y="35" width="6" height="13" />
            <polygon points="986,22 980,40 992,40" />
            
            <rect x="996" y="100" width="14" height="40" rx="1" />
            <rect x="1012" y="88" width="10" height="52" rx="1" />
            
            {/* Tree */}
            <circle cx="1032" cy="120" r="9" />
            <rect x="1030" y="127" width="4" height="13" />
            
            {/* === Far right: Suburban/mixed === */}
            <rect x="1046" y="105" width="14" height="35" rx="1" />
            <polygon points="1053,105 1044,113 1062,113" />
            <rect x="1062" y="95" width="18" height="45" rx="1" />
            <rect x="1082" y="110" width="10" height="30" rx="1" />
            
            {/* Apartment blocks */}
            <rect x="1096" y="72" width="20" height="68" rx="1" />
            <rect x="1118" y="85" width="14" height="55" rx="1" />
            <rect x="1134" y="62" width="16" height="78" rx="2" />
            <rect x="1138" y="56" width="8" height="6" />
            
            <rect x="1154" y="100" width="12" height="40" rx="1" />

            {/* Second windmill (smaller) */}
            <polygon points="1172,140 1180,140 1179,98 1173,98" />
            <line x1="1176" y1="98" x2="1160" y2="80" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <line x1="1176" y1="98" x2="1192" y2="80" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <line x1="1176" y1="98" x2="1176" y2="74" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <line x1="1176" y1="98" x2="1166" y2="110" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            
            {/* Trees */}
            <circle cx="1200" cy="120" r="10" />
            <rect x="1198" y="128" width="4" height="12" />
            <circle cx="1218" cy="124" r="7" />
            <rect x="1216" y="129" width="4" height="11" />
            
            {/* More houses */}
            <rect x="1232" y="108" width="12" height="32" rx="1" />
            <polygon points="1238,108 1230,116 1246,116" />
            <rect x="1246" y="104" width="14" height="36" rx="1" />
            <polygon points="1253,104 1244,112 1262,112" />
            
            <rect x="1264" y="90" width="18" height="50" rx="1" />
            <rect x="1284" y="100" width="12" height="40" rx="1" />
            <rect x="1298" y="80" width="16" height="60" rx="1" />
            <rect x="1316" y="95" width="10" height="45" rx="1" />
            
            {/* Final tall building */}
            <rect x="1330" y="65" width="18" height="75" rx="1" />
            <rect x="1350" y="105" width="12" height="35" rx="1" />
            <rect x="1364" y="92" width="14" height="48" rx="1" />
            <rect x="1380" y="110" width="10" height="30" rx="1" />
            <rect x="1392" y="98" width="16" height="42" rx="1" />
            <rect x="1410" y="115" width="12" height="25" rx="1" />
            <rect x="1424" y="108" width="16" height="32" rx="1" />
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
