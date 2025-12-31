"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wifi, Clock, Zap, Sun, Moon, LaptopMinimal, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

// --- Plans Array (Unchanged) ---
const plans = [
  {
    name: "Quick Surf",
    price: "₦200",
    duration: "2 Hour",
    speed: "20 Mbps",
    rate: "₦200/hr",
    cap: 25,
    devices: 1,
    description: "Perfect for quick checks and basic browsing.",
  },
  {
    name: "Daily Access",
    price: "₦350",
    duration: "24 Hours",
    speed: "20 Mbps",
    description: "All-day access for work, streaming, and socializing.",
    cap: 50,
    devices: 1,
  },
  {
    name: "Daily Access II",
    price: "₦500",
    duration: "24 Hours",
    speed: "25 Mbps",
    description: "All-day access for work, streaming, and socializing.",
    cap: "unlimited",
    devices: 2,
  },
  {
    name: "Weekly Connect", // New Weekly Plan
    price: "₦1,500",
    duration: "7 Days",
    speed: "30 Mbps",
    description: "Reliable connection for your full work week.",
    cap: "unlimited",
    devices: 2,
  },
  {
    name: "Power User",
    price: "₦1,000",
    duration: "1 Day",
    speed: "50 Mbps",
    description: "High-speed for heavy downloads and gaming.",
    cap: "unlimited",
    devices: 4,
  },
  {
    name: "Monthly Pro", // New Monthly Plan (optional, but good for range)
    price: "₦10,000",
    duration: "30 Days",
    speed: "100 Mbps",
    description: "The ultimate package for consistent high performance.",
    cap: "unlimited",
    devices: 2,
  },
];

export default function BuyInternetPage() {
  // --- 2. State for Dark/Light Mode ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginDetails, setLoginDetails] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
    setLoginDetails(null);
  };

  // ✅ PAYSTACK CALLBACK (NORMAL FUNCTION, NOT ASYNC)
const handlePaystackCallback = (response: any) => {
  console.log("Paystack success:", response);

  fetch(`/api/paystack/verify?reference=${response.reference}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toast({
          title: "Payment Successful",
          description: "Your internet access is now active",
        });
      } else {
        throw new Error();
      }
    })
    .catch(() => {
      toast({
        title: "Verification failed",
        description: "Please contact support",
        variant: "destructive",
      });
    });
};


  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;

      if (!email) {
        toast({
          title: "Email Required",
          description: "Please provide your email address for payment.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Initialize Paystack payment
      const initResponse = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
          amount: selectedPlan.price,
          plan: selectedPlan,
        }),
      });

      const initData = await initResponse.json();
      console.log("Payment init response:", { 
        status: initResponse.status, 
        ok: initResponse.ok, 
        error: initData.error,
        details: initData.details 
      });

      if (!initResponse.ok) {
        setIsPaymentOpen(false); // Close modal on initialization failure
        setIsProcessing(false);
        toast({
          title: "Payment Initialization Failed",
          description: initData.error || initData.details || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Check if public key is available
      if (!initData.public_key) {
        setIsPaymentOpen(false); // Close modal on configuration error
        setIsProcessing(false);
        toast({
          title: "Configuration Error",
          description: "Payment public key is not configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Wait for Paystack script to load
      if (!(window as any).PaystackPop) {
        // Wait a bit for script to load
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        if (!(window as any).PaystackPop) {
          setIsPaymentOpen(false); // Close modal on script error
          setIsProcessing(false);
          toast({
            title: "Payment Script Error",
            description: "Payment script failed to load. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }
      }

      // Open Paystack payment popup
      console.log("Setting up Paystack with:", {
        hasPublicKey: !!initData.public_key,
        email,
        amount: parseInt(selectedPlan.price.replace(/[₦,]/g, "")) * 100,
        reference: initData.reference
      });

      // @ts-ignore - Paystack is loaded via script tag
      if (typeof (window as any).PaystackPop === 'undefined') {
        throw new Error("PaystackPop is not available. Please refresh the page.");
      }

      const handler = (window as any).PaystackPop.setup({
        key: initData.public_key,
        email,
        amount: parseInt(selectedPlan.price.replace(/[₦,]/g, "")) * 100, // Convert to kobo
        ref: initData.reference,
        metadata: {
          plan: selectedPlan.name,
          phone: phone || "",
        },
        callback: handlePaystackCallback,
        // callback: async function (response: any) {
        //   console.log("Paystack callback:", response);
        //   // Verify payment
        //   setIsProcessing(true);
        //   try {
        //     const verifyResponse = await fetch(
        //       `/api/paystack/verify?reference=${response.reference}`
        //     );
        //     const verifyData = await verifyResponse.json();

        //     if (verifyResponse.ok && verifyData.success) {
        //       setLoginDetails({
        //         username: verifyData.username,
        //         password: verifyData.password,
        //       });
        //       setIsPaymentOpen(true); // Keep modal open to show credentials
        //       toast({
        //         title: "Payment Successful!",
        //         description: "Your internet access has been activated.",
        //       });
        //     } else {
        //       // Close modal on verification failure
        //       setIsPaymentOpen(false);
        //       setIsProcessing(false);
        //       toast({
        //         title: "Payment Verification Failed",
        //         description: verifyData.error || "Please contact support.",
        //         variant: "destructive",
        //       });
        //     }
        //   } catch (error) {
        //     // Close modal on error
        //     setIsPaymentOpen(false);
        //     setIsProcessing(false);
        //     toast({
        //       title: "Error",
        //       description: "Failed to verify payment. Please contact support.",
        //       variant: "destructive",
        //     });
        //   }
        // },
        onClose: function () {
          // Reset all states when user closes Paystack popup
          setIsProcessing(false);
          setIsPaymentOpen(false);
          setLoginDetails(null);
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment window.",
          });
        },
      });

      try {
        handler.openIframe();
        console.log("Paystack iframe opened successfully");
      } catch (iframeError: any) {
        console.error("Error opening Paystack iframe:", iframeError);
        throw new Error(`Failed to open payment window: ${iframeError?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      // Close modal on any unexpected error
      setIsPaymentOpen(false);
      setIsProcessing(false);
      console.error("Payment error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // Show more specific error message
      const errorMessage = error?.message || error?.toString() || "Something went wrong. Please try again.";
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
  };

  // --- 3. Dynamic Tailwind Classes based on Mode ---
  const modeClasses = {
    // Main Container - Dark with subtle purple tint
    bg: isDarkMode
      ? "bg-gradient-to-b from-[#0a0a0f] via-[#0f0a1a] to-[#0a0a0f] text-white"
      : "bg-gradient-to-br from-gray-50 to-white text-gray-900",

    // Card Background and Border
    card: isDarkMode
      ? "bg-gray-900/80 border-purple-900/50 shadow-xl hover:shadow-2xl hover:border-purple-700/50 h-full transition-all" // Purple border accents
      : "bg-white border-gray-200 shadow-lg hover:shadow-xl h-full", // ADDED h-full

    // Text Colors
    heading: isDarkMode ? "text-white" : "text-gray-900",
    subtext: isDarkMode ? "text-slate-400" : "text-gray-600",
    detailText: isDarkMode ? "text-slate-200" : "text-gray-700",

    // Button Class (Using purple accent to match theme)
    button: "bg-purple-600 hover:bg-purple-700 text-white font-semibold border-purple-500",

    // Icon Color (Purple accent for consistency)
    iconColor: isDarkMode ? "text-purple-400" : "text-purple-600",
  };

  return (
    <div
      className={`min-h-screen ${modeClasses.bg} ${isDarkMode ? 'particle-bg' : ''} flex flex-col transition-colors duration-500 font-montserrat`}
    >
      {/* Modern Header Section - Mobile Responsive */}
      <header className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 flex items-center justify-between relative z-20 border-b border-purple-900/20">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="relative">
            <Image
              src="/logowhite.png"
              alt="Abia Tech Hub Logo"
              width={64}
              height={64}
              className={`h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition duration-300 ${
                isDarkMode ? "logo-glow" : "invert"
              } drop-shadow-lg`}
              priority
            />
            <div className="absolute inset-0 bg-purple-500/20 blur-xl -z-10 rounded-full"></div>
          </div>
          <div className="hidden sm:block">
            <h2 className={`text-base sm:text-lg md:text-xl font-bold ${modeClasses.heading}`}>
              <span className="text-purple-400">Abia</span> Tech Hub
            </h2>
            <p className={`text-[10px] sm:text-xs ${modeClasses.subtext}`}>Fast Internet Access</p>
          </div>
        </motion.div>

        {/* Toggle Button - Mobile Responsive */}
        <Button
          onClick={toggleDarkMode}
          className={`${modeClasses.button} px-2 sm:px-3 py-2 rounded-full shadow-lg hover:scale-110 transition-transform`}
          variant="ghost"
          size="icon"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
      </header>

      {/* Plans Section - Customer Focused */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          {/* Simple Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${modeClasses.heading}`}>
              Choose Your Internet Plan
            </h1>
            <p className={`text-sm sm:text-base ${modeClasses.subtext} max-w-xl mx-auto mb-4`}>
              Select a plan and get connected instantly
            </p>
            {/* Important Notice at Top */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`bg-purple-900/30 border border-purple-700/50 rounded-lg px-4 sm:px-6 py-3 sm:py-4 max-w-2xl mx-auto`}
            >
              <p className={`text-xs sm:text-sm ${modeClasses.subtext} text-center`}>
                After payment, your internet access will be activated automatically.{" "}
                <span className="text-purple-400 font-semibold">Fast, secure, and reliable.</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Plans Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full items-stretch">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full" // Ensure the motion.div takes full height
          >
            <Card
              className={`${modeClasses.card} rounded-xl sm:rounded-2xl transition duration-300 transform hover:scale-[1.02] shadow-xl h-full`} // Ensure the Card takes full height
            >
              <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 h-full">
                {" "}
                {/* ADDED flex flex-col h-full */}
                {/* Content Wrapper that takes up all remaining space */}
                <div className="flex flex-col gap-6 flex-grow">
                  {" "}
                  {/* ADDED flex-grow */}
                  {/* Header Section */}
                  <div>
                    <h2
                      className={`text-lg sm:text-xl md:text-2xl font-bold mb-1 ${modeClasses.heading}`}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className={`${modeClasses.subtext} text-xs sm:text-sm md:text-base`}
                    >
                      {plan.description}
                    </p>
                  </div>
                  {/* Price Section */}
                  <div className="border-b border-purple-900/30 pb-3 sm:pb-4">
                    <span
                      className={`text-3xl sm:text-4xl font-extrabold ${modeClasses.heading}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm sm:text-base md:text-lg font-medium ml-2 ${modeClasses.subtext}`}
                    >
                      / {plan.duration}
                    </span>
                  </div>
                  {/* Features Section */}
                  <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
                    <div
                      className={`flex items-center gap-3 ${modeClasses.detailText}`}
                    >
                      <Clock className={`w-5 h-5 ${modeClasses.iconColor}`} />
                      <span className="font-medium">
                        {plan.duration} Subscription
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-3 ${modeClasses.detailText}`}
                    >
                      <Wifi className={`w-5 h-5 ${modeClasses.iconColor}`} />
                      <span className="font-medium">
                        Up to {plan.speed} Download
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-3 ${modeClasses.detailText}`}
                    >
                      <Zap className={`w-5 h-5 ${modeClasses.iconColor}`} />
                      <span className="font-medium">
                        {plan.cap === "unlimited"
                          ? "Unlimited"
                          : `${plan.cap} GB Cap`}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-3 ${modeClasses.detailText}`}
                    >
                      <LaptopMinimal
                        className={`w-5 h-5 ${modeClasses.iconColor}`}
                      />
                      <span className="font-medium">
                        {plan.devices > 1 ? `Connect up to ${plan.devices} devices` : "Connect 1 device"}
                      </span>
                    </div>
                  </div>
                </div>{" "}
                {/* End of flex-grow wrapper */}
                {/* Button Section - This will be pushed to the bottom */}
                <Button
                  onClick={() => handlePlanSelect(plan)}
                  className={`${modeClasses.button} w-full py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl mt-auto ${isDarkMode ? 'purple-glow-hover' : ''} transition-all`} // ADDED mt-auto
                >
                  Get {plan.name}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog 
        open={isPaymentOpen} 
        onOpenChange={(open) => {
          setIsPaymentOpen(open);
          // Reset all states when modal is closed to prevent UI distortion
          if (!open) {
            setIsProcessing(false);
            setLoginDetails(null);
            // Force cleanup of any Paystack iframes/overlays that might be stuck
            setTimeout(() => {
              const paystackElements = document.querySelectorAll('[id*="paystack"], iframe[src*="paystack"]');
              paystackElements.forEach(el => {
                try {
                  el.remove();
                } catch (e) {
                  console.warn("Error removing Paystack element:", e);
                }
              });
              // Remove any stuck overlays
              const stuckOverlays = document.querySelectorAll('body > div[style*="position: fixed"]');
              stuckOverlays.forEach(el => {
                if (el.getAttribute('id')?.includes('paystack') || 
                    (el as HTMLElement).style.zIndex === '999999') {
                  try {
                    el.remove();
                  } catch (e) {
                    console.warn("Error removing stuck overlay:", e);
                  }
                }
              });
            }, 100);
            // Don't reset selectedPlan here as user might want to try again
          }
        }}
      >
        <DialogContent 
          className={`${modeClasses.bg} border-purple-900/50 max-w-md`}
          onEscapeKeyDown={() => {
            if (!isProcessing) {
              setIsPaymentOpen(false);
              setIsProcessing(false);
              setLoginDetails(null);
            }
          }}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside during processing
            if (isProcessing) {
              e.preventDefault();
            }
          }}
        >
          {!loginDetails ? (
            <>
              <DialogHeader>
                <DialogTitle className={modeClasses.heading}>
                  Complete Payment - {selectedPlan?.name}
                </DialogTitle>
                <DialogDescription className={modeClasses.subtext}>
                  Amount: <span className="text-purple-400 font-bold">{selectedPlan?.price}</span>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${modeClasses.heading}`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-purple-900/50 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="08012345678"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${modeClasses.heading}`}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-purple-900/50 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="your@email.com"
                  />
                  <p className={`text-xs mt-1 ${modeClasses.subtext}`}>
                    Required for payment receipt
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPaymentOpen(false)}
                    className="border-purple-500 text-purple-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className={modeClasses.button}
                  >
                    {isProcessing ? "Processing..." : "Pay Now"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className={`${modeClasses.heading} text-green-400`}>
                  Payment Successful! 🎉
                </DialogTitle>
                <DialogDescription className={modeClasses.subtext}>
                  Your internet access has been activated. Use these credentials to connect:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${modeClasses.subtext}`}>
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={loginDetails.username}
                      readOnly
                      className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-purple-900/50 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} font-mono`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(loginDetails.username, "Username")}
                      className="border-purple-500"
                    >
                      {copiedField === "Username" ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-purple-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${modeClasses.subtext}`}>
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={loginDetails.password}
                      readOnly
                      className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-purple-900/50 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'} font-mono`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(loginDetails.password, "Password")}
                      className="border-purple-500"
                    >
                      {copiedField === "Password" ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-purple-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setIsPaymentOpen(false);
                      setLoginDetails(null);
                      setSelectedPlan(null);
                    }}
                    className={modeClasses.button}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
