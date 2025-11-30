import { Rocket } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <Rocket className="w-7 h-7 md:w-8 md:h-8" />
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
          My Awesome App
        </h1>
      </div>
    </header>
  );
}
