import { DestinationCard } from "@/components/ui/card-21";

const DestinationCardDemo = () => {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row items-center justify-center gap-8 md:gap-12 p-8 bg-background">
      <div className="w-full max-w-[320px] h-[450px]">
        <DestinationCard
          imageUrl="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
          location="Indonesia"
          flag="🇮🇩"
          stats="1,345 Hotels • 24 Packages"
          href="#"
          // A deep, lush green HSL value
          themeColor="150 50% 25%" 
        />
      </div>
      <div className="w-full max-w-[320px] h-[450px]">
        <DestinationCard
          imageUrl="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
          location="Dubai"
          flag="🇦🇪"
          stats="2,345 Hotels • 54 Packages"
          href="#"
          // A rich, twilight purple HSL value
          themeColor="250 50% 30%"
        />
      </div>
    </div>
  );
};

export default DestinationCardDemo;
