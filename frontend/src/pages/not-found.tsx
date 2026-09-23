import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary border border-border text-accent mb-6 shadow-xl">
        <Compass className="h-10 w-10 animate-pulse" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
        404 Error
      </span>
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
        Page Not Found
      </h1>
      <p className="max-w-md text-secondary-foreground text-sm leading-relaxed mb-8">
        The requested equity investigation path or page could not be located. Follow the evidence back to safety.
      </p>
      <Link to="/">
        <Button variant="default" size="lg" className="shadow-lg shadow-accent/20">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to IgniteStock
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
