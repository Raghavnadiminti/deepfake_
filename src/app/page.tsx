import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Welcome to your new app!
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mt-4">
                This is a starter template. You can start editing this page by modifying{' '}
                <code className="bg-muted p-1 rounded-md font-mono text-sm">src/app/page.tsx</code>.
            </p>
        </div>
      </main>
      <footer className="py-4">
        <p className="text-center text-sm text-muted-foreground">
          Built with Next.js and Firebase Studio
        </p>
      </footer>
    </div>
  );
}
