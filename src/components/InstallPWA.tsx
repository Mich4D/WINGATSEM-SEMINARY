import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from '../hooks/usePWA';

const InstallPWA: React.FC = () => {
  const { isInstallable, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Only show if not dismissed in this session
    if (!isDismissed) {
      if (isInstallable) {
        setIsVisible(true);
      } else if (isIOSDevice && !(window.navigator as any).standalone) {
        // Show iOS instruction after delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isDismissed, isInstallable]);

  const handleInstall = async () => {
    if (isIOS) return;
    await install();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Persist dismissal for this session
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  // Re-check dismissal on mount from sessionStorage
  useEffect(() => {
    if (sessionStorage.getItem('pwa_install_dismissed') === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 right-6 left-6 md:left-auto md:right-6 md:w-96 z-[9998] bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-900/30 rounded-2xl shadow-2xl p-4 shadow-yellow-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="text-yellow-600" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isIOS ? 'Add to Home Screen' : 'Install WGTS App'}
                </h3>
                <button 
                  onClick={handleDismiss}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isIOS 
                  ? 'Tap the Share icon at the bottom and select "Add to Home Screen" to install the app on your iPhone.'
                  : 'Install our app on your phone for faster access to classes, event updates and more!'
                }
              </p>
              <div className="mt-4 flex gap-3">
                {!isIOS && (
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Install Now
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className={`${isIOS ? 'w-full' : 'px-4'} py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm transition-all font-semibold`}
                >
                  {isIOS ? 'Got it' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;
