import { ArrowRight, MapPin, Bed, Square, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Mock data - will be replaced with real data from database
const mockListings = [
  {
    id: "1",
    title: "Modern appartement centrum",
    location: "Amsterdam Centrum",
    price: 1850,
    bedrooms: 2,
    area: 75,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60",
    type: "Appartement",
    isNew: true,
  },
  {
    id: "2",
    title: "Ruime eengezinswoning",
    location: "Utrecht Oost",
    price: 1650,
    bedrooms: 4,
    area: 120,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60",
    type: "Huis",
    isNew: false,
  },
  {
    id: "3",
    title: "Luxe penthouse met dakterras",
    location: "Rotterdam Zuid",
    price: 2450,
    bedrooms: 3,
    area: 110,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60",
    type: "Appartement",
    isNew: true,
  },
  {
    id: "4",
    title: "Gezellige studio",
    location: "Den Haag Centrum",
    price: 895,
    bedrooms: 1,
    area: 35,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=60",
    type: "Studio",
    isNew: false,
  },
  {
    id: "5",
    title: "Karakteristiek grachtenpand",
    location: "Amsterdam Jordaan",
    price: 2200,
    bedrooms: 3,
    area: 95,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60",
    type: "Appartement",
    isNew: true,
  },
];

const FeaturedListings = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Uitgelichte woningen
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ontdek de nieuwste en populairste woningen op ons platform
            </p>
          </div>
          <Link to="/zoeken" className="hidden md:block">
            <Button variant="ghost" className="gap-2">
              Bekijk alle woningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {mockListings.map((listing) => (
              <CarouselItem key={listing.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Link to={`/woning/${listing.id}`}>
                  <Card className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {listing.isNew && (
                        <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
                          Nieuw
                        </Badge>
                      )}
                      <button
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-muted-foreground backdrop-blur transition-colors hover:bg-white hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          // TODO: Add to favorites
                        }}
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <Badge variant="secondary" className="bg-white/90 text-foreground">
                          {listing.type}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="font-display text-lg font-bold text-primary">
                          € {listing.price.toLocaleString("nl-NL")}
                          <span className="text-sm font-normal text-muted-foreground">/mnd</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {listing.location}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{listing.bedrooms} slaapkamers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          <span>{listing.area} m²</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="mt-6 text-center md:hidden">
          <Link to="/zoeken">
            <Button variant="outline" className="gap-2">
              Bekijk alle woningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
