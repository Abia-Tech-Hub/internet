import React from "react";
import Link from "next/link";

const Nav = () => (
  <div className="flex justify-between py-4 sm:py-10 px-10 bg-slate-950 text-white mb-4">
    {" "}
    <div className="h-9 px-6 rounded text-3xl font-display">Thugger News</div>
    <div className=" mx-auto justify-center gap-x-4 space-x-7 border-b-2 border-orange-500">
      <Link href="">Politics</Link>
      <Link href="">Sports</Link>
      <Link href="">Finance</Link>
      <Link href="">Health & Fitness</Link>
      <Link href="">Travel</Link>
      <Link href="">Tech</Link>
      <Link href="">Gadgets</Link>
      <Link href="">Tech</Link>
    </div>
  </div>
);

export default Nav;
