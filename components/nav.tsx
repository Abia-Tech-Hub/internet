import React from "react";
import Link from "next/link";

const Nav = () => (
  <div className="flex justify-between py-4 sm:py-10 px-10 bg-gradient-to-r from-[#0a0a0f] via-[#0f0a1a] to-[#0a0a0f] text-white mb-4 border-b border-purple-900/30">
    {" "}
    <div className="h-9 px-6 rounded text-3xl font-display text-purple-400">Thugger News</div>
    <div className=" mx-auto justify-center gap-x-4 space-x-7 border-b-2 border-purple-500">
      <Link href="" className="hover:text-purple-400 transition-colors">Politics</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Sports</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Finance</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Health & Fitness</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Travel with me</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Tech</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Gadgets</Link>
      <Link href="" className="hover:text-purple-400 transition-colors">Tech</Link>
    </div>
  </div>
);

export default Nav;
