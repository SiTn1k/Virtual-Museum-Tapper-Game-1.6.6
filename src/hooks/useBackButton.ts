import { useEffect, useCallback } from 'react';
import { getTelegramWebApp } from '../lib/telegram';

/**
 * Hook for Telegram BackButton integration.
 * 
 * Shows/hides the Telegram BackButton based on modal state.
 * When BackButton is clicked, calls the provided onBack callback.
 * 
 * Usage:
 * ```tsx
 * const closeModal = useCallback(() => setShowModal(false), []);
 * const { showBackButton, hideBackButton } = useBackButton(closeModal);
 * 
 * useEffect(() => {
 *   if (showModal) {
 *     showBackButton();
 *   } else {
 *     hideBackButton();
 *   }
 * }, [showModal, showBackButton, hideBackButton]);
 * ```
 */
export function useBackButton(onBack: () => void) {
  const tg = getTelegramWebApp();
  const hasBackButton = !!tg?.BackButton;

  const showBackButton = useCallback(() => {
    if (!hasBackButton) return;
    tg!.BackButton.show();
  }, [hasBackButton, tg]);

  const hideBackButton = useCallback(() => {
    if (!hasBackButton) return;
    tg!.BackButton.hide();
  }, [hasBackButton, tg]);

  useEffect(() => {
    if (!hasBackButton) return;

    // Register click handler
    tg!.BackButton.onClick(onBack);

    // Cleanup on unmount
    return () => {
      tg!.BackButton.offClick(onBack);
      // Hide button when component unmounts
      tg!.BackButton.hide();
    };
  }, [hasBackButton, tg, onBack]);

  return {
    showBackButton,
    hideBackButton,
    hasBackButton,
  };
}
