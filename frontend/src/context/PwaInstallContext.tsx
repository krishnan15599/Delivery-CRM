import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Download, Smartphone, Share, MoreVertical, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallContextValue {
  isInstalled: boolean;
  hasNativePrompt: boolean;
  promptInstall: () => Promise<void>;
  openInstructions: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  isInstalled: false,
  hasNativePrompt: false,
  promptInstall: async () => {},
  openInstructions: () => {},
});

const checkIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const isIosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(isStandaloneMedia || isIosStandalone);
};

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(checkIsStandalone);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    mediaQuery?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowInstructions(true);
    }
  }, [deferredPrompt]);

  const openInstructions = useCallback(() => {
    setShowInstructions(true);
  }, []);

  const isIos =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <PwaInstallContext.Provider
      value={{
        isInstalled,
        hasNativePrompt: Boolean(deferredPrompt),
        promptInstall,
        openInstructions,
      }}
    >
      {children}

      {showInstructions && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#DDE5E3] shadow-2xl p-5 space-y-4 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#0F2A2E] text-[#F2B705] flex items-center justify-center shrink-0">
                  <Download className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="font-bold text-[#10201F] text-base leading-tight">
                    Install Delivery CRM
                  </h3>
                  <p className="text-xs text-[#5E716F] mt-0.5">
                    Add to your home screen for quick access &amp; alerts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="p-1.5 rounded-lg text-[#5E716F] hover:text-[#10201F] hover:bg-[#F2F5F4] cursor-pointer"
                aria-label="Close install instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              <div className="space-y-2.5 bg-[#F2F5F4] rounded-xl p-3.5 text-xs text-[#10201F]">
                <p className="font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#2563C9]" />
                  On iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#5E716F]">
                  <li>
                    Tap the <strong className="text-[#10201F] inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong className="text-[#10201F]">Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong className="text-[#10201F]">Add</strong> in the top-right corner.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 bg-[#F2F5F4] rounded-xl p-3.5 text-xs text-[#10201F]">
                <p className="font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#2563C9]" />
                  Install from Browser Menu:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#5E716F]">
                  <li>
                    Tap the browser menu (<strong className="text-[#10201F] inline-flex items-center"><MoreVertical className="w-3.5 h-3.5" /></strong>) in the top-right corner.
                  </li>
                  <li>
                    Select <strong className="text-[#10201F]">Install app</strong> or <strong className="text-[#10201F]">Add to Home screen</strong>.
                  </li>
                  <li>
                    Confirm by tapping <strong className="text-[#10201F]">Install</strong>.
                  </li>
                </ol>
                <p className="text-[11px] text-[#5E716F] pt-1 border-t border-[#DDE5E3]">
                  If you recently uninstalled the app, Chrome may wait briefly before showing the automatic prompt again — using the browser menu works anytime.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-[#0F2A2E] text-white font-semibold text-xs hover:bg-[#18424A] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => useContext(PwaInstallContext);
