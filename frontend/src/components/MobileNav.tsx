'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Kitchen Copilot</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-lg font-medium"
          >
            Home
          </Link>
          <Link
            href="/app"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-lg font-medium"
          >
            App
          </Link>
          <Link
            href="/features"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-lg font-medium"
          >
            Features
          </Link>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-lg font-medium"
          >
            About
          </Link>
          <div className="mt-4">
            <Link href="/app" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Try Now</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}