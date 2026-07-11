import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
          <a href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold inline-block">
            Go Back Home
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NotFound;
