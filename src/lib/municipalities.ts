/**
 * Mapping van Nederlandse gemeentes naar hun kernen (dorpen/wijken).
 *
 * Gebruikt door de gemeente-eerst selector zodat samengestelde gemeentes
 * zoals "Hof van Twente" netjes alle kernen tonen (Goor, Diepenheim, ...).
 *
 * Regels:
 * - Alleen gemeentes met meerdere kernen staan hier.
 * - De gemeentenaam zelf is NOOIT een kern (anders krijg je dubbele entries).
 * - Kernen worden gesorteerd alfabetisch in de UI.
 * - Enkelvoudige steden (bijv. Amsterdam, Utrecht) hoeven hier niet in te staan;
 *   die behandelen we als gemeente == kern.
 */
export const MUNICIPALITY_KERNEN: Record<string, string[]> = {
  "Hof van Twente": ["Goor", "Delden", "Diepenheim", "Markelo", "Bentelo", "Hengevelde", "Ambt Delden"],
  "Berkelland": ["Borculo", "Eibergen", "Neede", "Ruurlo", "Beltrum", "Geesteren (Gld)", "Rekken"],
  "Bronckhorst": ["Hengelo (Gld)", "Vorden", "Steenderen", "Hummelo", "Keijenborg", "Zelhem", "Drempt"],
  "Oost Gelre": ["Lichtenvoorde", "Groenlo", "Harreveld", "Mariënvelde", "Vragender", "Zieuwent"],
  "Aalten": ["Aalten", "Bredevoort", "Dinxperlo", "IJzerlo", "De Heurne"],
  "Oude IJsselstreek": ["Terborg", "Ulft", "Gendringen", "Silvolde", "Varsseveld", "Etten (Gld)", "Megchelen", "Netterden"],
  "Montferland": ["'s-Heerenberg", "Didam", "Zeddam", "Beek (Gld)", "Kilder", "Stokkum", "Lengel", "Loerbeek", "Nieuw-Dijk", "Wehl", "Loil", "Azewijn", "Braamt", "Vethuizen"],
  "Land van Cuijk": ["Cuijk", "Boxmeer", "Grave", "Mill", "Sint Anthonis", "Beugen", "Haps", "Linden", "Katwijk (NB)", "Beers", "Escharen", "Gassel", "Velp (NB)", "Langenboom", "Wanroij", "Oploo", "Stevensbeek", "Westerbeek", "Ledeacker", "Vortum-Mullem", "Sambeek", "Maashees", "Vierlingsbeek", "Holthees", "Overloon", "Groeningen", "Oeffelt", "Rijkevoort", "Sint Hubert", "Wilbertoord"],
  "Maashorst": ["Uden", "Schaijk", "Volkel", "Zeeland (NB)", "Reek", "Odiliapeel"],
  "Meierijstad": ["Veghel", "Schijndel", "Sint-Oedenrode", "Erp", "Eerde", "Mariaheide", "Nijnsel", "Olland", "Boerdonk", "Keldonk", "Zijtaart", "Wijbosch"],
  "Altena": ["Werkendam", "Woudrichem", "Andel", "Sleeuwijk", "Almkerk", "Nieuwendijk", "Hank", "Dussen", "Genderen", "Wijk en Aalburg", "Eethen", "Veen", "Babyloniënbroek", "Drongelen", "Giessen", "Rijswijk (NB)"],
  "Vijfheerenlanden": ["Vianen", "Leerdam", "Ameide", "Meerkerk", "Lexmond", "Hei- en Boeicop", "Schoonrewoerd", "Kedichem", "Oosterwijk", "Tienhoven aan de Lek", "Hagestein", "Everdingen", "Zijderveld"],
  "Molenlanden": ["Bleskensgraaf", "Goudriaan", "Groot-Ammers", "Hoogblokland", "Hoornaar", "Langerak", "Molenaarsgraaf", "Nieuwpoort", "Noordeloos", "Oud-Alblas", "Ottoland", "Streefkerk", "Wijngaarden", "Brandwijk", "Giessenburg", "Schelluinen", "Arkel"],
  "Hoeksche Waard": ["Oud-Beijerland", "'s-Gravendeel", "Heinenoord", "Klaaswaal", "Maasdam", "Mijnsheerenland", "Nieuw-Beijerland", "Numansdorp", "Piershil", "Puttershoek", "Strijen", "Westmaas", "Zuid-Beijerland", "Goudswaard"],
  "Goeree-Overflakkee": ["Middelharnis", "Sommelsdijk", "Ouddorp", "Stellendam", "Goedereede", "Dirksland", "Melissant", "Herkingen", "Nieuwe-Tonge", "Oude-Tonge", "Achthuizen", "Den Bommel", "Ooltgensplaat", "Stad aan 't Haringvliet"],
  "Westerkwartier": ["Leek", "Marum", "Zuidhorn", "Grijpskerk", "Aduard", "Oldekerk", "Niekerk", "Tolbert", "Boerakker", "Lettelbert", "Midwolde", "Nuis", "Niebert", "Doezum", "Kornhorn", "Opende", "Lutjegast", "Sebaldeburen", "Stroobos", "Visvliet", "Pieterzijl", "Kommerzijl", "Niezijl", "Briltil", "Noordhorn"],
  "Het Hogeland": ["Winsum", "Uithuizen", "Uithuizermeeden", "Bedum", "Leens", "Warffum", "Baflo", "Eenrum", "Kantens", "Usquert", "Pieterburen", "Lauwersoog", "Roodeschool", "Ulrum", "Zoutkamp", "Wehe-den Hoorn", "Hornhuizen", "Kloosterburen", "Mensingeweer", "Ranum", "Saaxumhuizen", "Schouwerzijl", "Vierhuizen", "Westernieland"],
  "Midden-Groningen": ["Hoogezand", "Sappemeer", "Slochteren", "Muntendam", "Zuidbroek", "Noordbroek", "Siddeburen", "Schildwolde", "Hellum", "Steendam", "Tjuchem", "Overschild", "Kolham", "Westerbroek", "Foxhol", "Kropswolde", "Waterhuizen", "Lageland", "Harkstede", "Scharmer", "Woudbloem", "Meeden"],
  "Oldambt": ["Winschoten", "Scheemda", "Nieuwolda", "Beerta", "Bad Nieuweschans", "Finsterwolde", "Drieborg", "Heiligerlee", "Midwolda", "Oostwold", "Westerlee", "Nieuw-Scheemda", "'t Waar", "Ganzedijk", "Hongerige Wolf", "Nieuw Beerta"],
  "Westerwolde": ["Sellingen", "Ter Apel", "Vlagtwedde", "Bourtange", "Onstwedde", "Wedde", "Bellingwolde", "Blijham", "Veelerveen", "Vriescheloo", "Jipsinghuizen", "Smeerling", "Mussel"],
  "Súdwest-Fryslân": ["Sneek", "Bolsward", "IJlst", "Workum", "Hindeloopen", "Stavoren", "Makkum", "Witmarsum", "Wommels", "Heeg", "Woudsend", "Sloten (Fr)", "Koudum", "Balk", "Oudemirdum", "Bakhuizen", "Warns", "Molkwerum", "Hemelum", "Pingjum", "Schettens", "Schraard", "Ferwoude", "Allingawier", "Exmorra", "Tjerkwerd", "Arum", "Lollum", "Burgwerd", "Hartwerd", "Nijland", "Folsgare", "Tirns", "Scharnegoutum", "Goënga", "Gauw", "Sibrandabuorren", "Tersoal", "Itens", "Easterein", "Reahûs", "Kûbaard", "Mantgum", "Jorwert", "Weidum", "Bears", "Baard", "Easterlittens", "Winsum (Fr)", "Wjelsryp", "Spannum"],
  "Noardeast-Fryslân": ["Dokkum", "Damwâld", "Kollum", "Hallum", "Holwerd", "Ee", "Engwierum", "Anjum", "Lioessens", "Metslawier", "Moddergat", "Nes (Fr)", "Niawier", "Oosternijkerk", "Oostmahorn", "Oudwoude", "Paesens", "Wetsens", "Wierum", "Westergeest", "Augsbuurt", "Burum", "Munnekezijl", "Triemen", "Veenklooster", "Brantgum", "Ferwert", "Marrum", "Reitsum", "Hegebeintum", "Genum", "Lichtaard", "Wânswert", "Burdaard", "Birdaard", "Janum", "Jislum", "Hijum"],
  "Waadhoeke": ["Franeker", "Sint Annaparochie", "Berltsum", "Menaam", "Dronryp", "Ried", "Tzum", "Tzummarum", "Sexbierum", "Pietersbierum", "Oosterbierum", "Achlum", "Boer", "Dongjum", "Firdgum", "Herbaijum", "Hitzum", "Klooster Lidlum", "Minnertsga", "Oudebildtzijl", "Sint Jacobiparochie", "Slappeterp", "Vrouwenparochie", "Westhoek", "Wier", "Zweins", "Schalsum"],
  "Tytsjerksteradiel": ["Burgum", "Hurdegaryp", "Gytsjerk", "Oentsjerk", "Garyp", "Sumar", "Eastermar", "Jistrum", "Noardburgum", "Suwâld", "Tytsjerk", "Earnewâld", "Aldtsjerk", "Mûnein", "Ryptsjerk", "Wyns", "Oudkerk"],
  "Achtkarspelen": ["Buitenpost", "Surhuisterveen", "Surhuizum", "Twijzel", "Twijzelerheide", "Augustinusga", "Drogeham", "Gerkesklooster", "Harkema", "Kootstertille", "Boelenslaan", "Stroobos"],
  "Smallingerland": ["Drachten", "Boornbergum", "Drachtstercompagnie", "De Wilgen", "De Tike", "Kortehemmen", "Nijega", "Opeinde", "Oudega", "Rottevalle", "Smalle Ee"],
  "De Fryske Marren": ["Joure", "Lemmer", "Balk", "Sint Nicolaasga", "Sondel", "Wijckel", "Bakhuizen", "Echtenerbrug", "Eesterga", "Follega", "Goingarijp", "Haskerhorne", "Idskenhuizen", "Langweer", "Oosterzee", "Oudehaske", "Rohel", "Rotsterhaule", "Rottum", "Scharsterbrug", "Sintjohannesga", "Sloten (Fr)", "Snikzwaag", "Spannenburg", "Terherne", "Terkaple", "Tjerkgaast", "Vegelinsoord"],
  "Opsterland": ["Gorredijk", "Beetsterzwaag", "Ureterp", "Wijnjewoude", "Bakkeveen", "Frieschepalen", "Hemrik", "Jonkerslân", "Lippenhuizen", "Nij Beets", "Olterterp", "Siegerswoude", "Terwispel", "Tijnje", "Langezwaag", "Luxwoude"],
  "Heerenveen": ["Heerenveen", "Akkrum", "Aldeboarn", "Jubbega", "Hoornsterzwaag", "Mildam", "Katlijk", "Oudehorne", "Nieuwehorne", "Bontebok", "De Knipe", "Tjalleberd", "Luinjeberd", "Gersloot", "Haskerdijken", "Nieuwebrug", "Oudeschoot", "Oranjewoud", "Nieuweschoot", "Terband"],
  "Weststellingwerf": ["Wolvega", "Noordwolde (Fr)", "Boijl", "De Blesse", "Steggerda", "Oldeholtpade", "Oldeholtwolde", "Nijeholtpade", "Nijeholtwolde", "Peperga", "Vinkega", "Sonnega", "Spanga", "Munnekeburen", "Scherpenzeel (Fr)", "Slijkenburg", "Langelille", "Oosterstreek"],
  "Ooststellingwerf": ["Oosterwolde (Fr)", "Appelscha", "Donkerbroek", "Haulerwijk", "Makkinga", "Oldeberkoop", "Elsloo (Fr)", "Fochteloo", "Langedijke", "Nijeberkoop", "Ravenswoud", "Waskemeer"],
  "Aa en Hunze": ["Annen", "Gieten", "Rolde", "Gasselte", "Eext", "Anloo", "Schipborg", "Anderen", "Annerveenschekanaal", "Eexterveen", "Gasselternijveen", "Grolloo", "Nieuwediep", "Nieuw-Annerveen", "Eexterveenschekanaal"],
  "Borger-Odoorn": ["Borger", "Odoorn", "Nieuw-Buinen", "Valthermond", "2e Exloërmond", "1e Exloërmond", "Drouwen", "Drouwenermond", "Drouwenerveen", "Ees", "Eesergroen", "Eeserveen", "Exloo", "Klijndijk", "Nieuw-Weerdinge", "Westdorp", "Valthe", "Buinen", "Buinerveen"],
  "Tynaarlo": ["Eelde", "Paterswolde", "Vries", "Zuidlaren", "Yde", "De Punt", "Zeegse", "Zuidlaarderveen", "Bunne", "Donderen", "Midlaren", "Oudemolen", "Taarlo", "Tynaarlo", "Winde"],
  "Coevorden": ["Coevorden", "Sleen", "Dalen", "Schoonoord", "Oosterhesselen", "Aalden", "Benneveld", "De Kiel", "Gees", "Geesbrug", "Holsloot", "Meppen", "Noord-Sleen", "Steenwijksmoer", "Stieltjeskanaal", "Wachtum", "Wezup", "Zweeloo", "Zwinderen", "'t Haantje"],
  "Hardenberg": ["Hardenberg", "Dedemsvaart", "Gramsbergen", "Balkbrug", "Bergentheim", "Slagharen", "Lutten", "Kloosterhaar", "Bruchterveld", "Schuinesloot", "Sibculo", "De Krim", "Diffelen", "Heemserveen", "Hoogenweg", "Mariënberg", "Radewijk", "Rheeze", "Rheezerveen", "Venebrugge", "Ane", "Anerveen", "Holtheme", "Brucht"],
  "Dalfsen": ["Dalfsen", "Nieuwleusen", "Lemelerveld", "Hoonhorst", "Oudleusen", "Vilsteren", "Ankum"],
  "Ommen": ["Ommen", "Beerzerveld", "Lemele", "Stegeren", "Witharen", "Junne"],
  "Steenwijkerland": ["Steenwijk", "Vollenhove", "Giethoorn", "Sint Jansklooster", "Belt-Schutsloot", "Blankenham", "Blokzijl", "De Bult", "Eesveen", "Kalenberg", "Kuinre", "Marknesse (Stw)", "Muggenbeet", "Onna", "Ossenzijl", "Oldemarkt", "Paasloo", "Scheerwolde", "Steenwijkerwold", "Tuk", "Wanneperveen", "Wetering", "Willemsoord", "Zuidveen"],
  "Twenterand": ["Vriezenveen", "Den Ham", "Vroomshoop", "Westerhaar-Vriezenveensewijk"],
  "Hellendoorn": ["Nijverdal", "Hellendoorn", "Daarle", "Daarlerveen", "Marle", "Hancate"],
  "Wierden": ["Wierden", "Enter", "Hoge Hexel", "Notter", "Zuna", "Rectum", "Ypelo"],
  "Tubbergen": ["Tubbergen", "Albergen", "Geesteren (Ov)", "Reutum", "Vasse", "Mander", "Manderveen", "Fleringen", "Harbrinkhoek", "Hezingen", "Langeveen"],
  "Dinkelland": ["Denekamp", "Ootmarsum", "Weerselo", "Lattrop-Breklenkamp", "Tilligte", "Beuningen (Ov)", "Noord Deurningen", "Rossum (Ov)", "Saasveld", "De Lutte", "Agelo"],
  "Losser": ["Losser", "Overdinkel", "De Lutte", "Beuningen (Ov)", "Glanerbrug"],
  "Haaksbergen": ["Haaksbergen", "Buurse", "Sint Isidorushoeve"],
  "Olst-Wijhe": ["Olst", "Wijhe", "Boerhaar", "Boskamp", "Den Nul", "Diepenveen", "Eikelhof", "Marle (Ov)", "Welsum", "Wesepe"],
  "Raalte": ["Raalte", "Heeten", "Heino", "Lierderholthuis", "Luttenberg", "Mariënheem", "Nieuw Heeten", "Broekland"],
  "Voorst": ["Twello", "Klarenbeek", "Terwolde", "Teuge", "Wilp", "De Vecht", "Voorst", "Bussloo", "Empe", "Gietelo", "Posterenk", "Steenenkamer"],
  "Brummen": ["Brummen", "Eerbeek", "Hall", "Empe", "Leuvenheim", "Tonden", "Coldenhove", "Oeken"],
  "Lochem": ["Lochem", "Gorssel", "Almen", "Barchem", "Eefde", "Epse", "Exel", "Harfsen", "Joppe", "Kring van Dorth", "Laren (Gld)", "Velhorst"],
  "Apeldoorn": ["Apeldoorn", "Beekbergen", "Loenen (Gld)", "Hoenderloo", "Hoog Soeren", "Klarenbeek", "Lieren", "Nieuw-Milligen", "Niersen", "Radio Kootwijk", "Uddel", "Wenum Wiesel", "Ugchelen"],
  "Epe": ["Epe", "Vaassen", "Emst", "Oene"],
  "Nunspeet": ["Nunspeet", "Elspeet", "Hulshorst", "Vierhouten"],
  "Oldebroek": ["Oldebroek", "Wezep", "Hattemerbroek", "Noordeinde (Gld)", "'t Loo-Oldebroek", "Oosterwolde (Gld)"],
  "Kampen": ["Kampen", "IJsselmuiden", "Wilsum", "Kampereiland", "Mastenbroek", "Grafhorst", "'s-Heerenbroek", "Zalk"],
  "Zwartewaterland": ["Hasselt", "Genemuiden", "Zwartsluis"],
  "Staphorst": ["Staphorst", "Rouveen", "IJhorst", "Punthorst"],
  "Meppel": ["Meppel", "Nijeveen", "Rogat", "De Schiphorst"],
  "Westerveld": ["Diever", "Dwingeloo", "Vledder", "Havelte", "Darp", "Frederiksoord", "Wilhelminaoord", "Wapserveen", "Wapse", "Doldersum", "Geeuwenbrug", "Wittelte", "Nijensleek", "Eemster"],
  "De Wolden": ["Zuidwolde (Dr)", "Ruinen", "Ruinerwold", "Echten (Dr)", "Koekange", "Veeningen", "Berghuizen", "Kerkenveld", "Linde", "Nieuweroord", "Pesse", "Tiendeveen"],
  "Hoogeveen": ["Hoogeveen", "Hollandscheveld", "Noordscheschut", "Stuifzand", "Elim", "Nieuwlande", "Fluitenberg"],
  "Midden-Drenthe": ["Beilen", "Smilde", "Westerbork", "Bovensmilde", "Hooghalen", "Hijken", "Spier", "Wijster", "Drijber", "Holthe", "Mantinge", "Garminge", "Oranje", "Eursinge", "Witteveen", "Zwiggelte", "Hoogersmilde"],
  "Noordenveld": ["Roden", "Norg", "Peize", "Nieuw-Roden", "Een", "Veenhuizen", "Steenbergen (Dr)", "Foxwolde", "Lieveren", "Matsloot", "Nietap", "Roderwolde", "Sandebuur", "Westervelde", "Zuidvelde", "Een-West"],
  "Hulst": ["Hulst", "Kloosterzande", "Vogelwaarde", "Hengstdijk", "Lamswaarde", "Walsoorden", "Graauw", "Nieuw-Namen", "Sint Jansteen", "Heikant", "Clinge", "Koewacht"],
  "Sluis": ["Oostburg", "Aardenburg", "IJzendijke", "Breskens", "Cadzand", "Groede", "Sint Anna ter Muiden", "Retranchement", "Sluis", "Schoondijke", "Hoofdplaat", "Nieuwvliet", "Waterlandkerkje", "Zuidzande", "Eede", "Heille", "Sint Kruis"],
  "Terneuzen": ["Terneuzen", "Axel", "Zaamslag", "Sas van Gent", "Westdorpe", "Sluiskil", "Philippine", "Hoek", "Biervliet", "Koewacht", "Othene", "Spui", "Zuiddorpe", "Driewegen"],
  "Schouwen-Duiveland": ["Zierikzee", "Bruinisse", "Burgh-Haamstede", "Renesse", "Brouwershaven", "Scharendijke", "Nieuwerkerk", "Oosterland", "Haamstede", "Burgh", "Noordwelle", "Serooskerke", "Sirjansland", "Dreischor", "Zonnemaire", "Ouwerkerk", "Kerkwerve", "Noordgouwe", "Ellemeet"],
  "Reimerswaal": ["Yerseke", "Kruiningen", "Rilland", "Krabbendijke", "Hansweert", "Schore", "Waarde", "Oostdijk"],
  "Borsele": ["Heinkenszand", "'s-Gravenpolder", "Kwadendamme", "Nieuwdorp", "Driewegen", "Ovezande", "Hoedekenskerke", "Baarland", "Borssele", "Oudelande", "Nisse", "'s-Heer Abtskerke", "Lewedorp", "Ellewoutsdijk"],
  "Veere": ["Domburg", "Westkapelle", "Aagtekerke", "Biggekerke", "Gapinge", "Grijpskerke", "Koudekerke", "Meliskerke", "Oostkapelle", "Serooskerke (Veere)", "Vrouwenpolder", "Zoutelande", "Sint Laurens"],
  "Tholen": ["Tholen", "Sint-Maartensdijk", "Sint-Annaland", "Stavenisse", "Poortvliet", "Scherpenisse", "Oud-Vossemeer", "Sint Philipsland", "Tholen-Stad"],
  "Texel": ["Den Burg", "De Cocksdorp", "Den Hoorn (NH)", "De Koog", "Oudeschild", "Oosterend", "De Waal"],
  "Hollands Kroon": ["Anna Paulowna", "Hippolytushoef", "Wieringerwerf", "Den Oever", "Slootdorp", "Middenmeer", "Westerland", "Lutjewinkel", "Nieuwe Niedorp", "Oude Niedorp", "Winkel", "'t Veld", "Kreileroord", "Wieringerwaard", "Barsingerhorn", "Kolhorn", "Lambertschaag", "Haringhuizen"],
  "Schagen": ["Schagen", "Petten", "Callantsoog", "Sint Maarten", "Sint Maartensbrug", "Tuitjenhorn", "Warmenhuizen", "Eenigenburg", "Burgervlotbrug", "Stroe", "Waarland", "'t Zand", "Schagerbrug", "Dirkshorn", "Krabbendam", "Sint Maartenszee", "Oudesluis"],
  "Medemblik": ["Medemblik", "Wervershoof", "Andijk", "Nibbixwoud", "Wognum", "Zwaagdijk-Oost", "Zwaagdijk-West", "Hauwert", "Twisk", "Abbekerk", "Midwoud", "Oostwoud", "Onderdijk", "Opperdoes", "Sijbekarspel", "Benningbroek"],
  "Stede Broec": ["Bovenkarspel", "Grootebroek", "Lutjebroek"],
  "Koggenland": ["Avenhorn", "De Goorn", "Berkhout", "Hensbroek", "Obdam", "Spierdijk", "Ursem", "Zuidermeer", "Scharwoude"],
  "Opmeer": ["Opmeer", "Spanbroek", "Hoogwoud", "De Weere", "Aartswoud"],
  "Castricum": ["Castricum", "Akersloot", "Limmen", "De Woude", "Bakkum"],
  "Bergen (NH)": ["Bergen (NH)", "Egmond aan Zee", "Egmond aan den Hoef", "Egmond-Binnen", "Schoorl", "Catrijp", "Camperduin", "Groet", "Hargen", "Aagtdorp"],
  "Haarlemmermeer": ["Hoofddorp", "Nieuw-Vennep", "Badhoevedorp", "Zwanenburg", "Vijfhuizen", "Cruquius", "Lijnden", "Lisserbroek", "Rijsenhout", "Zwaanshoek", "Beinsdorp", "Aalsmeerderbrug", "Boesingheliede", "Burgerveen", "Leimuiderbrug", "Oude Meer", "Rozenburg (NH)", "Schiphol", "Buitenkaag", "Abbenes", "Weteringbrug"],
  "Dijk en Waard": ["Heerhugowaard", "Langedijk", "Broek op Langedijk", "Zuid-Scharwoude", "Noord-Scharwoude", "Sint Pancras", "Oudkarspel", "Koedijk"],
  "Heusden": ["Drunen", "Vlijmen", "Nieuwkuijk", "Elshout", "Haarsteeg", "Hedikhuizen", "Herpt", "Doeveren", "Heesbeen", "Oudheusden"],
  "Loon op Zand": ["Kaatsheuvel", "Loon op Zand", "De Moer"],
  "Drimmelen": ["Made", "Lage Zwaluwe", "Hooge Zwaluwe", "Terheijden", "Wagenberg", "Den Hout"],
  "Oosterhout": ["Oosterhout", "Dorst", "Oosteind", "Den Hout"],
  "Moerdijk": ["Zevenbergen", "Klundert", "Willemstad", "Fijnaart", "Standdaarbuiten", "Heijningen", "Helwijk", "Langeweg", "Moerdijk", "Noordhoek", "Oudemolen (NB)", "Zevenbergschen Hoek", "Zwingelspaan"],
  "Steenbergen": ["Steenbergen", "Dinteloord", "Kruisland", "Nieuw-Vossemeer", "De Heen", "Welberg"],
  "Halderberge": ["Oudenbosch", "Hoeven", "Bosschenhoofd", "Oud Gastel", "Stampersgat"],
  "Rucphen": ["Rucphen", "Sprundel", "Sint Willebrord", "Schijf", "Zegge"],
  "Bergeijk": ["Bergeijk", "Westerhoven", "Riethoven", "Luyksgestel", "Weebosch"],
  "Eersel": ["Eersel", "Knegsel", "Steensel", "Vessem", "Wintelre", "Duizel"],
  "Reusel-De Mierden": ["Reusel", "Hooge Mierde", "Lage Mierde", "Hulsel"],
  "Bladel": ["Bladel", "Hapert", "Hoogeloon", "Casteren", "Netersel"],
  "Cranendonck": ["Budel", "Maarheeze", "Soerendonk", "Gastel", "Budel-Schoot", "Budel-Dorplein"],
  "Heeze-Leende": ["Heeze", "Leende", "Sterksel", "Leenderstrijp"],
};

/**
 * Slug helper voor gemeentenamen (gebruikt o.a. voor URL-routes).
 */
export const municipalitySlug = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

/**
 * Geeft alle kernen voor een gemeente terug, alfabetisch gesorteerd.
 * Als de gemeente geen onderverdeling heeft, retourneert het de gemeente zelf.
 */
export const getKernen = (municipality: string): string[] => {
  const kernen = MUNICIPALITY_KERNEN[municipality];
  if (!kernen || kernen.length === 0) return [municipality];
  return [...kernen].sort((a, b) => a.localeCompare(b, "nl"));
};

/**
 * Bepaalt of een gemeente meerdere kernen heeft (UI toont dan stap 2).
 */
export const hasMultipleKernen = (municipality: string): boolean => {
  const kernen = MUNICIPALITY_KERNEN[municipality];
  return Array.isArray(kernen) && kernen.length > 1;
};