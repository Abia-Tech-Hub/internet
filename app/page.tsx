"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Clock, Zap, Sun, Moon, LaptopMinimal } from "lucide-react";
import { motion } from "framer-motion";

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

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- 3. Dynamic Tailwind Classes based on Mode ---
  const modeClasses = {
    // Main Container
    bg: isDarkMode
      ? "bg-black text-white"
      : "bg-gradient-to-br from-gray-50 to-white text-gray-900",

    // Card Background and Border
    card: isDarkMode
      ? "bg-gray-800/70 border-gray-700 shadow-xl hover:shadow-2xl h-full" // ADDED h-full
      : "bg-white border-gray-200 shadow-lg hover:shadow-xl h-full", // ADDED h-full

    // Text Colors
    heading: isDarkMode ? "text-white" : "text-gray-900",
    subtext: isDarkMode ? "text-slate-400" : "text-gray-600",
    detailText: isDarkMode ? "text-slate-200" : "text-gray-700",

    // Button Class (Using a primary green accent for better visibility)
    button: "bg-green-600 hover:bg-green-700 text-white font-semibold",

    // Icon Color (Same as subtext for consistency)
    iconColor: isDarkMode ? "text-green-400" : "text-green-600",
  };

  return (
    <div
      className={`min-h-screen ${modeClasses.bg} flex flex-col items-center px-4 py-10 transition-colors duration-500 font-montserrat`}
    >
      <div>
        {/* Using a standard div/img approach since I don't have the image file */}
        <div
          className={`h-32 mx-auto transition duration-300 flex items-center justify-center text-3xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <img
            src="/logowhite.png"
            alt="Abia Tech Hub Logo"
            className={`h-32 mx-auto transition duration-300 ${
              isDarkMode ? "" : "invert"
            }`}
          />
        </div>

        {/* --- Toggle Button --- */}
        <Button
          onClick={toggleDarkMode}
          className={`absolute top-4 right-4 ${modeClasses.button} px-2.5 rounded-full`}
          variant="ghost"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 mt-4"
      >
        <h1
          className={`text-4xl md:text-5xl font-extrabold mb-4 ${modeClasses.heading}`}
        >
          <span className="text-green-500">Abia</span> Tech Hub
        </h1>
        <p className={`max-w-xl text-sm ${modeClasses.subtext}`}>
          Fast, reliable internet access powered by Starlink. Choose a plan and
          get connected instantly.
        </p>
      </motion.div>

      {/* The grid container forces all columns to be the height of the tallest item */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl items-stretch px-0 sm:px-12 ">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full" // Ensure the motion.div takes full height
          >
            <Card
              className={`${modeClasses.card} rounded-2xl transition duration-300 transform hover:scale-[1.02] shadow-xl h-full`} // Ensure the Card takes full height
            >
              <CardContent className="p-8 flex flex-col gap-6 h-full">
                {" "}
                {/* ADDED flex flex-col h-full */}
                {/* Content Wrapper that takes up all remaining space */}
                <div className="flex flex-col gap-6 flex-grow">
                  {" "}
                  {/* ADDED flex-grow */}
                  {/* Header Section */}
                  <div>
                    <h2
                      className={`text-sl md:text-2xl font-bold mb-1 ${modeClasses.heading}`}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className={`${modeClasses.subtext} text-base md:text-sm`}
                    >
                      {plan.description}
                    </p>
                  </div>
                  {/* Price Section */}
                  <div className="border-b pb-4">
                    <span
                      className={`text-4xl font-extrabold ${modeClasses.heading}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-xl md:text-base font-medium ml-2 ${modeClasses.subtext}`}
                    >
                      {plan.price} / {plan.duration}
                    </span>
                  </div>
                  {/* Features Section */}
                  <div className="flex flex-col gap-3 md:text-sm ">
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
                  className={`${modeClasses.button} w-full py-6 text-lg sm:text-base rounded-xl mt-auto`} // ADDED mt-auto
                >
                  Get {plan.name}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className={`text-sm mt-12 ${modeClasses.subtext}`}>
        After payment, your internet access will be activated automatically.
      </p>
    </div>
  );
}
