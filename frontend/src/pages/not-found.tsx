import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 404 page.
 * Left-aligned, single accent CTA, 0.25rem radius, no pulsing decorative icon.
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-start justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-[0.25rem] border border-border bg-primary text-accent">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-bold text-accent">404 Error</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-base text-secondary-foreground leading-relaxed">
          The requested equity investigation path or page could not be located. Follow the
          evidence back to safety.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button variant="default" size="lg">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to IgniteStock
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
