import React from 'react';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { InboxPending } from '@/components/InboxPending';

const Home = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
          Welkom bij Coat24
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload bestanden voor analyse of bekijk je inbox voor te verwerken berichten
        </p>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
        <FileAnalyzer />
        <InboxPending />
      </div>
    </div>
  );
};

export default Home;