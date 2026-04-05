import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';

interface MainLayoutProps {
  sidebar: React.ReactNode;
  chatArea: React.ReactNode;
  infoPane: React.ReactNode;
}

export default function MainLayout({ sidebar, chatArea, infoPane }: MainLayoutProps) {
  const { showRightPane, activeRoom } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden relative">
      {/* Left Sidebar */}
      <div 
        className={`w-full md:w-80 flex-shrink-0 border-r border-border bg-card/80 backdrop-blur-xl z-20 transition-all duration-300 ${
          activeRoom ? 'hidden md:block' : 'block'
        }`}
      >
        {sidebar}
      </div>

      {/* Main Chat Area */}
      <div 
        className={`flex-1 flex-col relative z-10 box-border bg-background transition-all duration-300 ${
          !activeRoom ? 'hidden md:flex' : 'flex'
        }`}
      >
        {chatArea}
      </div>

      {/* Right Info Pane (Toggleable) */}
      <AnimatePresence>
        {showRightPane && (
          <motion.div
            initial={{ x: isMobile ? '100%' : 0, width: isMobile ? '100%' : 0, opacity: 0 }}
            animate={{ x: 0, width: isMobile ? '100%' : 320, opacity: 1 }}
            exit={{ x: isMobile ? '100%' : 0, width: isMobile ? '100%' : 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`flex-shrink-0 border-l border-border bg-card/95 backdrop-blur-xl overflow-hidden shadow-2xl z-50 ${
              isMobile ? 'absolute inset-0' : 'relative'
            }`}
          >
            {infoPane}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
