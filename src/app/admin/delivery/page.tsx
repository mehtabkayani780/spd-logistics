"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Package,
  User,
  Phone,
  Calendar,
  Wallet,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  Printer,
  FileText,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeliveryPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Delivery Modal State
  const [deliveryModalBilty, setDeliveryModalBilty] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState({
    receivedBy: "",
    receiverCnic: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
    collectRemainingAmount: true,
    deliveryNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchConsignments();
  }, []);

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/bilty");
      const data = await res.json();
      if (data.consignments) {
        setConsignments(data.consignments);
      }
    } catch (err) {
      console.error("Error fetching consignments for delivery:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelivery = (bilty: any) => {
    setDeliveryModalBilty(bilty);
    setDeliveryData({
      receivedBy: bilty.receiverName || "",
      receiverCnic: "",
      deliveryDate: new Date().toISOString().slice(0, 10),
      collectRemainingAmount: (bilty.remainingBalance || 0) > 0,
      deliveryNotes: "",
    });
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalBilty) return;

    setSubmitting(true);
    try {
      const remaining = deliveryModalBilty.remainingBalance || 0;
      const willCollect = deliveryData.collectRemainingAmount && remaining > 0;
      const newPaid = willCollect
        ? (deliveryModalBilty.paidAmount || 0) + remaining
        : deliveryModalBilty.paidAmount || 0;

      const payload = {
        id: deliveryModalBilty.id,
        shipmentStatus: "DELIVERED",
        location: deliveryModalBilty.destination || "Destination Hub",
        statusNote: `Delivered to ${deliveryData.receivedBy} on ${deliveryData.deliveryDate}. ${deliveryData.deliveryNotes}`,
        paidAmount: newPaid,
      };

      const res = await fetch("/api/admin/bilty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to confirm delivery");
      }

      setFeedback({
        type: "success",
        text: `Consignment ${deliveryModalBilty.biltyNumber} successfully marked as DELIVERED to ${deliveryData.receivedBy}!`,
      });
      setDeliveryModalBilty(null);
      fetchConsignments();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to confirm delivery" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConsignments = consignments.filter((b) => {
    // Status filter
    if (statusFilter === "PENDING") {
      if (b.shipmentStatus === "DELIVERED" || b.shipmentStatus === "DELETED") return false;
    } else if (statusFilter === "DELIVERED") {
      if (b.shipmentStatus !== "DELIVERED") return false;
    }

    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      b.biltyNumber?.toLowerCase().includes(s) ||
      b.trackingId?.toLowerCase().includes(s) ||
      b.receiverName?.toLowerCase().includes(s) ||
      b.receiverPhone?.toLowerCase().includes(s) ||
      b.destination?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trip Setup
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-600">Customer Handover</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            Consignment Delivery & POD
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manual delivery confirmation and proof of delivery (POD). Settle remaining freight balances and record consignee verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/bilty">
            <Button variant="outline" className="rounded-xl text-xs font-bold gap-2">
              <Package className="w-4 h-4 text-spd-red" />
              <span>All Consignments</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Bilty #, Receiver name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="PENDING">Awaiting Delivery</option>
            <option value="DELIVERED">Delivered Consignments</option>
            <option value="ALL">All Statuses</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchConsignments}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-slate-500">
            {filteredConsignments.length} Records
          </span>
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading delivery records...</p>
        </div>
      ) : filteredConsignments.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Consignments Matching Filter
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Consignments ready for customer handover will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Bilty # / Date</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Consignee / Receiver</th>
                  <th className="p-3">Goods / Packages</th>
                  <th className="p-3 text-right">Freight & Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredConsignments.map((b) => {
                  const isDelivered = b.shipmentStatus === "DELIVERED";
                  const remaining = b.remainingBalance || 0;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-bold font-mono text-red-600 block">
                          {b.biltyNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(b.date || b.createdAt)}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.origin} → {b.destination}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {b.warehouse || "Warehouse"}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.receiverName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {b.receiverPhone}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                          {b.receiverAddress}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {b.packageDetails || "Commercial Goods"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {b.quantity || 1} Pkgs &bull; {b.weight || 0} kg
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block">
                          {formatCurrency(b.freight || 0)}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold block ${
                            remaining <= 0 ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {remaining <= 0 ? "Paid In Full" : `Due: ${formatCurrency(remaining)}`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {b.shipmentStatus}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        {isDelivered ? (
                          <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenDelivery(b)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 h-8 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Delivery</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM DELIVERY MODAL */}
      <Dialog open={!!deliveryModalBilty} onOpenChange={() => setDeliveryModalBilty(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Delivery & Handover
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record consignee verification details and settle any remaining balance.
            </DialogDescription>
          </DialogHeader>

          {deliveryModalBilty && (
            <form onSubmit={handleConfirmDelivery} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Bilty Number:</span>
                  <span className="font-mono font-black text-red-600">
                    {deliveryModalBilty.biltyNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Shipper:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {deliveryModalBilty.senderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Destination:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {deliveryModalBilty.destination}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">Remaining Balance Due:</span>
                  <span className="font-mono font-black text-amber-600">
                    {formatCurrency(deliveryModalBilty.remainingBalance || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Received By (Full Name) *
                </Label>
                <Input
                  required
                  value={deliveryData.receivedBy}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, receivedBy: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Receiver CNIC / ID Card
                </Label>
                <Input
                  value={deliveryData.receiverCnic}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, receiverCnic: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Handover Date *
                </Label>
                <Input
                  type="date"
                  required
                  value={deliveryData.deliveryDate}
                  onChange={(e) =>
                    setDeliveryData({ ...deliveryData, deliveryDate: e.target.value })
                  }
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {(deliveryModalBilty.remainingBalance || 0) > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="collectRemaining"
                    checked={deliveryData.collectRemainingAmount}
                    onChange={(e) =>
                      setDeliveryData({
                        ...deliveryData,
                        collectRemainingAmount: e.target.checked,
                      })
                    }
                    className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="collectRemaining"
                    className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
                  >
                    Collect remaining balance of {formatCurrency(deliveryModalBilty.remainingBalance)} at delivery
                  </label>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeliveryModalBilty(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Delivery Handover</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
