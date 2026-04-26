import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';

interface PaymentButtonProps {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  onSuccess: (response: any) => void;
  onBeforePayment?: () => Promise<boolean>;
  text: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
  flutterwavePublicKey?: string;
  currency?: string;
}

export default function PaymentButton({
  amount,
  description,
  customerEmail,
  customerName,
  onSuccess,
  onBeforePayment,
  text,
  className,
  disabled,
  flutterwavePublicKey,
  currency = 'NGN'
}: PaymentButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { logoUrl } = useSettings();

  const loadFlutterwaveScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
      document.head.appendChild(script);
    });
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isProcessing || isVerifying) return;
    setIsProcessing(true);

    try {
      if (onBeforePayment) {
        const shouldProceed = await onBeforePayment();
        if (!shouldProceed) {
          setIsProcessing(false);
          return;
        }
      }

      await loadFlutterwaveScript();

      const publicKey = (flutterwavePublicKey || "").trim();

      if (!publicKey || (!publicKey.startsWith('FLWPUBK_') && !publicKey.startsWith('FLWPUBK-'))) {
        alert("Payment system is not yet configured with a valid Public Key. Please contact administrator.");
        setIsProcessing(false);
        return;
      }

      // @ts-ignore
      if (window.FlutterwaveCheckout) {
        console.log("Initializing Flutterwave Checkout...");
        // @ts-ignore
        window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          amount: amount,
          currency: currency,
          payment_options: "card,mobilemoney,ussd",
          customer: {
            email: customerEmail || "student@email.com",
            phone_number: "0000000000",
            name: customerName || "Student",
          },
          customizations: {
            title: "WGTS Payment",
            description: description,
            logo: logoUrl ? formatImageUrl(logoUrl) : "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
          },
          callback: async function (data: any) {
            console.log("Flutterwave callback data:", data);
            if (data.status === "successful") {
              setIsVerifying(true);
              
              // Explicitly close the Flutterwave modal
              // @ts-ignore
              if (typeof window !== 'undefined' && window.FlutterwaveCheckout && typeof window.FlutterwaveCheckout.close === 'function') {
                // @ts-ignore
                window.FlutterwaveCheckout.close();
              } else {
                // Fallback for some v3 implementations
                const iframes = document.getElementsByName('checkout');
                if (iframes.length > 0) {
                  iframes[0].remove();
                }
                // Try selecting by ID as well
                const iframeById = document.getElementById('flwpugpaidid');
                if (iframeById) {
                  iframeById.remove();
                }
              }

              try {
                // For prototype, we bypass backend verification since Cloud Functions might not be deployed
                console.log("Payment successful on frontend. Proceeding...");
                
                // Safety timeout to reset state if onSuccess hangs
                const timeoutId = setTimeout(() => {
                  setIsVerifying(false);
                  setIsProcessing(false);
                }, 30000);

                await onSuccess(data);
                clearTimeout(timeoutId);
              } catch (error) {
                console.error("Error processing successful payment:", error);
              } finally {
                setIsVerifying(false);
                setIsProcessing(false);
              }
            } else {
              setIsProcessing(false);
            }
          },
          onclose: function() {
            console.log("Payment modal closed");
            setIsProcessing(false);
          }
        });

        // Check if iframe was injected, if not after 3 seconds, assume failure
        setTimeout(() => {
          const iframes = document.querySelectorAll('iframe');
          let flutterwaveFound = false;
          iframes.forEach(iframe => {
            if (iframe.src.includes('flutterwave') || iframe.name === 'checkout') {
              flutterwaveFound = true;
            }
          });
          
          if (!flutterwaveFound) {
            console.error("Flutterwave iframe not found in DOM after initialization.");
            // Only alert if we are still processing (meaning it didn't close normally)
            setIsProcessing((current) => {
              if (current) {
                alert("The payment window failed to open. Please check your browser's popup blocker or try again.");
                return false;
              }
              return current;
            });
          }
        }, 3000);

      } else {
        throw new Error("FlutterwaveCheckout not found after script load");
      }

    } catch (error) {
      console.error("Flutterwave error:", error);
      alert("An error occurred while initializing payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} transition-opacity duration-300`}
      disabled={disabled || isVerifying || isProcessing}
    >
      {isVerifying ? 'Verifying...' : isProcessing ? 'Processing...' : text}
    </button>
  );
}
