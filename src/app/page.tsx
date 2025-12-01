import Header from '@/components/header';
import ImageUploader from '@/components/image-uploader';
// import ImageUploader from '@/components/imager2';
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
             Detecting DeepFake Videos with 2D Convolutional Neural Networks
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl mt-4 mb-8">
            Upload an image or video to check if it's a deepfake using AI.
          </p>
          <ImageUploader />
        </div>
      </main>
      <footer className="py-4">
        <p className="text-center text-sm text-muted-foreground">
        </p>
      </footer>
    </div>
  );
}