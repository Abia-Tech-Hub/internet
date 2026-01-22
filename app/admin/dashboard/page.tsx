"use client";
import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Terminal,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Copy,
  Wallet,
  Search,
  BarChart3,
  TrendingUp,
  History,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

export default function AdminDashboard() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genCount, setGenCount] = useState(200);
  const { toast } = useToast();

  const DURATIONS: Record<string, number> = {
    QUICK_SURF: 2 * 60 * 60 * 1000,
    DAILY_ACCESS: 24 * 60 * 60 * 1000,
    DAILY_ACCESS_II: 24 * 60 * 60 * 1000,
    POWER_USER: 24 * 60 * 60 * 1000,
    WEEKLY_CONNECT: 7 * 24 * 60 * 60 * 1000,
    MONTHLY_PRO: 30 * 24 * 60 * 60 * 1000,
  };

  const prices: Record<string, number> = {
    QUICK_SURF: 200,
    DAILY_ACCESS: 350,
    DAILY_ACCESS_II: 500,
    POWER_USER: 1000,
    WEEKLY_CONNECT: 1500,
    MONTHLY_PRO: 10000,
  };

  const COLORS = [
    "#a855f7",
    "#8b5cf6",
    "#6366f1",
    "#3b82f6",
    "#0ea5e9",
    "#06b6d4",
  ];
  const profileNames = Object.keys(prices);

  useEffect(() => {
    const unsubVouchers = onSnapshot(collection(db, "vouchers"), (snapshot) => {
      setVouchers(snapshot.docs.map((doc) => doc.data()));
    });

    const q = query(
      collection(db, "vouchers"),
      where("isUsed", "==", true),
      orderBy("soldAt", "desc"),
      limit(5),
    );
    const unsubSales = onSnapshot(q, (snapshot) => {
      setRecentSales(snapshot.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubVouchers();
      unsubSales();
    };
  }, []);

  const { stats, categoryData, chartData, pieData, purgeReadyCount } =
    useMemo(() => {
      const used = vouchers.filter((v) => v.isUsed);
      const now = new Date().getTime();

      const expiredCount = vouchers.filter((v) => {
        if (!v.isUsed || !v.soldAt || !v.planType) return false;
        return (
          now > new Date(v.soldAt).getTime() + (DURATIONS[v.planType] || 0)
        );
      }).length;

      const breakdown = profileNames.map((name) => ({
        name,
        available: vouchers.filter((v) => v.planType === name && !v.isUsed)
          .length,
        used: used.filter((v) => v.planType === name).length,
        revenue:
          used.filter((v) => v.planType === name).length * (prices[name] || 0),
      }));

      const days = [...Array(7)]
        .map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toLocaleDateString("en-GB", { weekday: "short" });
        })
        .reverse();

      const revenueMap: Record<string, number> = {};
      days.forEach((day) => (revenueMap[day] = 0));
      used.forEach((v) => {
        if (!v.soldAt) return;
        const day = new Date(v.soldAt).toLocaleDateString("en-GB", {
          weekday: "short",
        });
        if (revenueMap[day] !== undefined)
          revenueMap[day] += prices[v.planType] || 0;
      });

      return {
        stats: {
          total: vouchers.length,
          available: vouchers.filter((v) => !v.isUsed).length,
          used: used.length,
          revenue: used.reduce(
            (acc, curr) => acc + (prices[curr.planType] || 0),
            0,
          ),
        },
        categoryData: breakdown,
        chartData: days.map((name) => ({ name, revenue: revenueMap[name] })),
        pieData: breakdown
          .filter((d) => d.revenue > 0)
          .map((d) => ({ name: d.name, value: d.revenue })),
        purgeReadyCount: expiredCount,
      };
    }, [vouchers]);

  const filteredVoucher = useMemo(() => {
    if (!searchQuery) return null;
    return vouchers.find((v) =>
      v.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, vouchers]);

  const generateScript = (profile: string) => {
    return `:for i from=1 to=${genCount} do={ :local pass ""; :local charset "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz"; :for j from=1 to=5 do={ :set pass ($pass . [:pick $charset [:rndnum from=0 to=([:len $charset] - 1)]]) }; /ip hotspot user add name=("ATH-".[:rndstr length=5]) password=$pass profile=${profile} comment="Batch_Generated" }`;
  };

  const getExportCommand = () =>
    `/execute script={ /ip hotspot user export file=vouchers_export where comment~"Batch_" }`;

  const handlePurgeUsed = async () => {
    const now = new Date().getTime();
    if (!confirm(`Permanently delete expired records?`)) return;
    setIsCleaning(true);
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, "vouchers"), where("isUsed", "==", true));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          now >
          new Date(data.soldAt).getTime() + (DURATIONS[data.planType] || 0)
        )
          batch.delete(docSnap.ref);
      });
      await batch.commit();
      toast({ title: "Purge Complete" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 font-montserrat selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-purple-900/30 pb-6 gap-6 font-montserrat">
          <div className="flex justify-between items-center w-full lg:w-auto">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
                  <Zap className="fill-white" size={24} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent italic">
                  Voucher Control Center
                </h1>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Inventory & Revenue Intelligence
              </p>
            </div>

            {/* Desktop Navigation Link */}
            <nav className="hidden lg:flex ml-8">
              <Link
                href="/admin/how-it-works"
                className="text-sm font-medium text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-2"
              >
                <span className="h-1 w-1 rounded-full bg-purple-500"></span>
                How it works
              </Link>
            </nav>

            {/* Mobile Navigation (Sheet) */}
            <div className="lg:hidden">
              <Sheet>
                {/* Fixed: SheetTrigger now contains exactly one child element (the Button) */}
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HiOutlineMenuAlt4 className="text-3xl" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-[#0a0a0f] border-purple-900/30 text-white font-montserrat"
                >
                  <div className="mt-10 flex flex-col gap-4">
                    <Link
                      href="/admin/how-it-works"
                      className="text-lg font-semibold hover:text-purple-400 transition-colors font-montserrat text-center pt-12"
                    >
                      How it works
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <Input
              placeholder="Find subscriber username..."
              className="pl-10 bg-black/40 border-purple-900/40 focus:border-purple-500 transition-all font-montserrat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filteredVoucher && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f1a] border border-purple-500/50 p-4 rounded-xl z-50 shadow-2xl backdrop-blur-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                      Live Match
                    </p>
                    <p className="font-mono text-xl font-bold text-white">
                      {filteredVoucher.username}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Pass:{" "}
                      <span className="text-white font-mono">
                        {filteredVoucher.password}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-purple-500/30 font-montserrat"
                    onClick={() => {
                      navigator.clipboard.writeText(filteredVoucher.password);
                      toast({ title: "Password Copied" });
                    }}
                  >
                    Copy Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="In Stock"
            value={stats.available}
            color="text-green-400"
            icon={<CheckCircle size={24} />}
            sub="Available for sales"
          />
          <StatCard
            title="Total Sold"
            value={stats.used}
            color="text-purple-400"
            icon={<XCircle size={24} />}
            sub="Activated users"
          />
          <StatCard
            title="Revenue"
            value={`₦${stats.revenue.toLocaleString()}`}
            color="text-white"
            icon={<Wallet size={24} />}
            sub="Gross earnings"
          />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gray-900/40 border-purple-900/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-purple-900/10">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-purple-400" size={18} />
                <CardTitle className="text-md font-bold uppercase tracking-tight">
                  Revenue Stream
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e1e2e"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₦${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f0f1a",
                      border: "1px solid #3b0764",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-purple-900/20 text-white">
            <CardHeader className="border-b border-purple-900/10">
              <CardTitle className="text-md flex items-center gap-2 font-bold uppercase tracking-tight">
                <TrendingUp size={18} className="text-purple-400" />
                Market Share
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2 mt-4">
                {pieData.slice(0, 4).map((item, i) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-bold">
                      ₦{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900/50 border-purple-900/50 text-white flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-purple-900/20">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <CardTitle>MikroTik Control</CardTitle>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-purple-900/30">
                <span className="text-[10px] font-bold text-slate-500">
                  BATCH SIZE:
                </span>
                <input
                  type="number"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 0)}
                  className="bg-transparent w-12 text-center text-purple-400 font-bold outline-none text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
              {profileNames.map((p) => (
                <CommandBlock
                  key={p}
                  label={`Generate ${genCount}: ${p}`}
                  cmd={generateScript(p)}
                />
              ))}
              <div className="pt-4 border-t border-purple-900/30">
                <CommandBlock
                  label="Advanced System Export"
                  cmd={getExportCommand()}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-purple-900/20 text-white">
            <CardHeader className="border-b border-purple-900/10">
              <CardTitle className="text-md flex items-center gap-2">
                <History size={18} className="text-purple-400" />
                Live Sales Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-purple-900/10">
                {recentSales.map((sale, i) => (
                  <div
                    key={i}
                    className="p-4 flex justify-between items-center hover:bg-purple-900/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">
                        ₦
                      </div>
                      <div>
                        <p className="text-sm font-bold font-mono text-purple-200">
                          {sale.username}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          {sale.planType.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-green-400">
                        + ₦{prices[sale.planType]}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(sale.soldAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance */}
        <Card className="bg-gray-900/50 border-red-900/50 text-white overflow-hidden">
          <div className="flex flex-col md:flex-row items-center">
            <div className="p-8 border-r border-red-900/20 bg-red-900/5 flex flex-col items-center justify-center min-w-[200px]">
              <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center leading-tight">
                Database
                <br />
                Cleanup
              </p>
            </div>
            <div className="p-8 flex-1 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex gap-12 text-center md:text-left">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Records Found
                  </p>
                  <p className="text-4xl font-black">{stats.total}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase">
                    Expired/Used
                  </p>
                  <p className="text-4xl font-black text-red-500">
                    {purgeReadyCount}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full md:w-auto font-bold px-12 h-14 text-lg shadow-xl shadow-red-900/20 active:scale-95 transition-all"
                onClick={handlePurgeUsed}
                disabled={isCleaning || purgeReadyCount === 0}
              >
                {isCleaning ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <Trash2 size={20} className="mr-2" />
                )}
                Purge Expired Data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, sub }: any) {
  return (
    <Card className="bg-gray-900/80 border-purple-900/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <CardContent className="pt-6">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          {title}
        </p>
        <h2 className={`text-4xl font-black my-1 ${color} tracking-tighter`}>
          {value}
        </h2>
        <p className="text-[10px] text-slate-500 font-medium">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CommandBlock({ label, cmd }: { label: string; cmd: string }) {
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    toast({ title: "Copied", description: "Script copied to clipboard." });
  };
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest ml-1">
        {label}
      </p>
      <div className="bg-black/60 p-3 rounded-xl border border-purple-900/30 flex justify-between items-center gap-4 group hover:border-purple-500/50 transition-colors">
        <code className="text-[10px] text-green-400 font-mono truncate">
          {cmd}
        </code>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-purple-500/20 text-slate-400 transition-all"
          onClick={copy}
        >
          <Copy size={16} />
        </Button>
      </div>
    </div>
  );
}
