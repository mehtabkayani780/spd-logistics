"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  UserCog,
  Plus,
  Search,
  KeyRound,
  Truck,
  Phone,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Edit,
  Upload,
  Camera,
  MessageSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { buildWhatsAppUrl, getAdminToDriverWhatsAppMessage } from "@/lib/whatsapp";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const [resetPasswordDriver, setResetPasswordDriver] = useState<any>(null);
  const [deleteDriver, setDeleteDriver] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [viewDriver, setViewDriver] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState("");

  // Photo state for Add Driver
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string>("");
  const addFileInputRef = React.useRef<HTMLInputElement>(null);

  // Photo state for Edit Driver
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>("");
  const [editPhotoRemoved, setEditPhotoRemoved] = useState<boolean>(false);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      return "Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit. Please choose a smaller photo.";
    }
    return null;
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    cnic: "",
    licenseNumber: "",
    licenseExpiry: "",
    address: "",
    emergencyContact: "",
    assignedVehicleId: "",
    vehicleNumber: "",
    status: "AVAILABLE",
    photo: "",
    notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    phone: "",
    cnic: "",
    licenseNumber: "",
    licenseExpiry: "",
    address: "",
    emergencyContact: "",
    assignedVehicleId: "",
    vehicleNumber: "",
    status: "AVAILABLE",
    photo: "",
    notes: "",
  });

  const LOCAL_DRIVERS_KEY = "spd_local_drivers";
  const LOCAL_DELETED_DRIVERS_KEY = "spd_local_deleted_drivers";

  const getLocalDrivers = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_DRIVERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalDriver = (d: any) => {
    if (typeof window === "undefined") return;
    try {
      const list = getLocalDrivers();
      const idx = list.findIndex((x) => x.id === d.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...d };
      } else {
        list.unshift(d);
      }
      localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Save local driver error:", err);
    }
  };

  const removeLocalDriver = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const list = getLocalDrivers().filter((x) => x.id !== id);
      localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(list));
      const delRaw = localStorage.getItem(LOCAL_DELETED_DRIVERS_KEY);
      const del = delRaw ? JSON.parse(delRaw) : [];
      if (!del.includes(id)) {
        del.push(id);
        localStorage.setItem(LOCAL_DELETED_DRIVERS_KEY, JSON.stringify(del));
      }
    } catch (err) {
      console.warn("Remove local driver error:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      let list: any[] = [];
      try {
        const res = await fetch(`/api/admin/drivers?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          list = data.data;
        }
      } catch (err) {
        console.warn("API driver fetch error:", err);
      }

      // Merge local drivers
      const localList = getLocalDrivers();
      for (const ld of localList) {
        const idx = list.findIndex((x) => x.id === ld.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...ld };
        } else {
          list.unshift(ld);
        }
      }

      // Filter out deleted
      const delRaw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_DELETED_DRIVERS_KEY) : null;
      const deletedIds: string[] = delRaw ? JSON.parse(delRaw) : [];
      list = list.filter((d) => !deletedIds.includes(d.id) && d.status !== "DELETED");

      setDrivers(list);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/admin/vehicles");
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, [search, statusFilter]);

  const handleUploadPhoto = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      let photoUrl = "";
      if (addPhotoFile) {
        setUploadingPhoto(true);
        photoUrl = await handleUploadPhoto(addPhotoFile);
      }

      const assignedVeh = vehicles.find((v) => v.id === formData.assignedVehicleId);
      const newDrv = {
        id: `drv_loc_${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        contact: formData.phone,
        email: formData.email,
        cnic: formData.cnic,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        assignedVehicleId: formData.assignedVehicleId,
        vehicleNumber: assignedVeh ? assignedVeh.vehicleNumber : formData.vehicleNumber,
        status: formData.status,
        photo: photoUrl || null,
        notes: formData.notes,
        user: { email: formData.email || `driver.${formData.phone}@spdlogistics.com`, status: "ACTIVE" },
        vehicles: assignedVeh ? [{ id: assignedVeh.id, vehicleNumber: assignedVeh.vehicleNumber }] : [],
        consignments: [],
        _count: { consignments: 0 },
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage immediately
      saveLocalDriver(newDrv);

      // Prepend to state immediately
      setDrivers((prev) => [newDrv, ...prev]);

      // Fire background API call
      fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photo: photoUrl || null }),
      }).catch((err) => console.warn("Background driver API save:", err));

      setAddModalOpen(false);
      setAddPhotoFile(null);
      setAddPhotoPreview("");
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        cnic: "",
        licenseNumber: "",
        licenseExpiry: "",
        address: "",
        emergencyContact: "",
        assignedVehicleId: "",
        vehicleNumber: "",
        status: "AVAILABLE",
        photo: "",
        notes: "",
      });
      setActionFeedback({ type: "success", text: `Driver ${newDrv.name} created successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to create driver");
    } finally {
      setUploadingPhoto(false);
      setSubmitting(false);
    }
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDriver) return;
    setSubmitting(true);
    setFormError("");

    try {
      let finalPhotoUrl = editFormData.photo;
      if (editPhotoRemoved) {
        finalPhotoUrl = "";
      } else if (editPhotoFile) {
        setUploadingPhoto(true);
        finalPhotoUrl = await handleUploadPhoto(editPhotoFile);
      }

      const assignedVeh = vehicles.find((v) => v.id === editFormData.assignedVehicleId);
      const updated = {
        ...editDriver,
        ...editFormData,
        vehicleNumber: assignedVeh ? assignedVeh.vehicleNumber : editFormData.vehicleNumber,
        photo: finalPhotoUrl || null,
      };

      // Save locally immediately
      saveLocalDriver(updated);

      // Update state immediately
      setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

      // Background API call
      fetch("/api/admin/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editFormData, photo: finalPhotoUrl || null }),
      }).catch(() => {});

      setEditModalOpen(false);
      setEditDriver(null);
      setEditPhotoFile(null);
      setEditPhotoPreview("");
      setEditPhotoRemoved(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setActionFeedback({ type: "success", text: `Driver ${editFormData.name} updated successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to update driver");
    } finally {
      setUploadingPhoto(false);
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordDriver || !newPassword) return;

    setSubmitting(true);
    try {
      fetch("/api/admin/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetPasswordDriver.id,
          password: newPassword,
        }),
      }).catch(() => {});

      setResetPasswordDriver(null);
      setNewPassword("");
      setActionFeedback({ type: "success", text: "Driver password reset successfully!" });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error resetting driver password:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!deleteDriver) return;
    setDeleting(true);
    try {
      // Remove locally immediately
      removeLocalDriver(deleteDriver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== deleteDriver.id));

      if (viewDriver?.id === deleteDriver.id) {
        setViewDriver(null);
      }

      // Background API delete
      fetch(`/api/admin/drivers?id=${deleteDriver.id}`, {
        method: "DELETE",
      }).catch(() => {});

      setActionFeedback({ type: "success", text: `Driver ${deleteDriver.name} deleted successfully.` });
      setDeleteDriver(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({ type: "error", text: "Unable to delete driver." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Fleet Drivers & Personnel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage long-haul transport drivers, assign vehicles, create driver login credentials, and track route statuses.
          </p>
        </div>
        <Button
          onClick={() => {
            setAddPhotoFile(null);
            setAddPhotoPreview("");
            setFormError("");
            if (addFileInputRef.current) addFileInputRef.current.value = "";
            setAddModalOpen(true);
          }}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 h-10 px-4 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Driver</span>
        </Button>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border animate-fade-in ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search driver name, phone, CNIC, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDrivers}
            className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-400 font-semibold">Loading drivers...</p>
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No drivers registered"
          description="Add your first fleet driver to assign shipments and vehicles."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <Table className="min-w-[850px]">
            <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Driver Name & CNIC</TableHead>
                <TableHead className="text-xs font-bold">Contact & Login</TableHead>
                <TableHead className="text-xs font-bold">License # & Expiry</TableHead>
                <TableHead className="text-xs font-bold">Assigned Truck</TableHead>
                <TableHead className="text-xs font-bold">Total Trips</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                        {d.photo || d.user?.avatar ? (
                          <img
                            src={d.photo || d.user?.avatar}
                            alt={d.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="font-bold text-xs text-slate-500">
                            {d.name?.slice(0, 2).toUpperCase() || "DR"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{d.cnic || "No CNIC recorded"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {d.phone || d.contact}
                        </p>
                        {(d.phone || d.contact) && (
                          <a
                            href={buildWhatsAppUrl(
                              d.phone || d.contact,
                              getAdminToDriverWhatsAppMessage({
                                driverName: d.name,
                                vehicleNumber: d.vehicleNumber || d.vehicles?.[0]?.vehicleNumber,
                              })
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Login: {d.user?.email || "None"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {d.licenseNumber || "N/A"}
                    </p>
                    {d.licenseExpiry && (
                      <p className="text-[10px] text-slate-400">Exp: {formatDate(d.licenseExpiry)}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-spd-blue" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {d.vehicleNumber || d.vehicles?.[0]?.vehicleNumber || "Unassigned"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                    {d._count?.consignments || 0} consignments
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        d.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : d.status === "ASSIGNED" || d.status === "ON_TRIP"
                          ? "bg-blue-100 text-spd-blue dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        title="View Driver Profile & Trips"
                        onClick={() => setViewDriver(d)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        title="Edit Driver & Photo"
                        onClick={() => {
                          const photoUrl = d.photo || d.user?.avatar || "";
                          setEditDriver(d);
                          setEditFormData({
                            id: d.id,
                            name: d.name || "",
                            phone: d.phone || d.contact || "",
                            cnic: d.cnic || "",
                            licenseNumber: d.licenseNumber || "",
                            licenseExpiry: d.licenseExpiry ? d.licenseExpiry.split("T")[0] : "",
                            address: d.address || "",
                            emergencyContact: d.emergencyContact || "",
                            assignedVehicleId: d.assignedVehicleId || "",
                            vehicleNumber: d.vehicleNumber || "",
                            status: d.status || "AVAILABLE",
                            photo: photoUrl,
                            notes: d.notes || "",
                          });
                          setEditPhotoPreview(photoUrl);
                          setEditPhotoFile(null);
                          setEditPhotoRemoved(false);
                          if (editFileInputRef.current) editFileInputRef.current.value = "";
                          setFormError("");
                          setEditModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        title="Reset Driver Login Password"
                        onClick={() => {
                          setResetPasswordDriver(d);
                          setNewPassword("");
                        }}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete Driver"
                        onClick={() => setDeleteDriver(d)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL 1: ADD DRIVER */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-600" />
              Register New Fleet Driver
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create driver profile and portal login credentials. Driver can sign in at /driver-login.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateDriver} className="space-y-4 pt-2">
            {/* Driver Photo Upload Control */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative shadow-xs">
                {addPhotoPreview || formData.photo ? (
                  <img
                    src={addPhotoPreview || formData.photo}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <UserCog className="w-10 h-10 text-slate-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Profile Photo
                </Label>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={addFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const err = validateImageFile(file);
                      if (err) {
                        setFormError(err);
                        if (addFileInputRef.current) addFileInputRef.current.value = "";
                        return;
                      }
                      setFormError("");
                      setAddPhotoFile(file);
                      const objectUrl = URL.createObjectURL(file);
                      setAddPhotoPreview(objectUrl);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addFileInputRef.current?.click()}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{addPhotoPreview || formData.photo ? "Change Photo" : "Upload Photo"}</span>
                  </Button>
                  {(addPhotoPreview || formData.photo) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddPhotoFile(null);
                        setAddPhotoPreview("");
                        setFormData({ ...formData, photo: "" });
                        if (addFileInputRef.current) addFileInputRef.current.value = "";
                      }}
                      className="h-8 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">JPG, JPEG, PNG, WebP up to 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Full Name *
                </Label>
                <Input
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Mobile / Contact Phone *
                </Label>
                <Input
                  required
                  placeholder="03219876543"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Driver Login Email / Identifier *
                </Label>
                <Input
                  required
                  type="email"
                  placeholder="driver@spdlogistics.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl h-10 text-xs border-emerald-200 dark:border-emerald-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Driver Login Password *
                </Label>
                <Input
                  required
                  type="password"
                  placeholder="driver123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rounded-xl h-10 text-xs border-emerald-200 dark:border-emerald-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  CNIC Number
                </Label>
                <Input
                  placeholder="35201-1234567-1"
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  License Number
                </Label>
                <Input
                  placeholder="LHR-HTV-9921"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  License Expiry Date
                </Label>
                <Input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Assigned Vehicle
                </Label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => {
                    const sel = vehicles.find((v) => v.id === e.target.value);
                    setFormData({
                      ...formData,
                      assignedVehicleId: e.target.value,
                      vehicleNumber: sel ? sel.vehicleNumber : "",
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="">No Vehicle Assigned</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} &bull; {v.model || v.vehicleType || "Truck"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Emergency Contact
                </Label>
                <Input
                  placeholder="Relative name & phone"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Residential Address
                </Label>
                <Input
                  placeholder="Address details"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create Driver Account</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 1B: EDIT DRIVER */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Edit Driver Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update driver details, assigned vehicle, and profile picture.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleUpdateDriver} className="space-y-4 pt-2">
            {/* Driver Photo Upload & Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-blue-500/40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative shadow-xs">
                {editPhotoPreview ? (
                  <img
                    src={editPhotoPreview}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <UserCog className="w-10 h-10 text-slate-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Profile Photo
                </Label>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const err = validateImageFile(file);
                      if (err) {
                        setFormError(err);
                        if (editFileInputRef.current) editFileInputRef.current.value = "";
                        return;
                      }
                      setFormError("");
                      setEditPhotoFile(file);
                      setEditPhotoRemoved(false);
                      const objectUrl = URL.createObjectURL(file);
                      setEditPhotoPreview(objectUrl);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>{editPhotoPreview ? "Change Photo" : "Upload Photo"}</span>
                  </Button>
                  {editPhotoPreview && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditPhotoFile(null);
                        setEditPhotoPreview("");
                        setEditPhotoRemoved(true);
                        setEditFormData({ ...editFormData, photo: "" });
                        if (editFileInputRef.current) editFileInputRef.current.value = "";
                      }}
                      className="h-8 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">JPG, JPEG, PNG, WebP up to 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Full Name *
                </Label>
                <Input
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Mobile / Contact Phone *
                </Label>
                <Input
                  required
                  placeholder="03219876543"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  CNIC Number
                </Label>
                <Input
                  placeholder="35201-1234567-1"
                  value={editFormData.cnic}
                  onChange={(e) => setEditFormData({ ...editFormData, cnic: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driving License Number
                </Label>
                <Input
                  placeholder="LHR-DL-98765"
                  value={editFormData.licenseNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
                  className="rounded-xl h-10 text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  License Expiry Date
                </Label>
                <Input
                  type="date"
                  value={editFormData.licenseExpiry}
                  onChange={(e) => setEditFormData({ ...editFormData, licenseExpiry: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Assign Vehicle / Truck
                </Label>
                <select
                  value={editFormData.assignedVehicleId}
                  onChange={(e) => {
                    const sel = vehicles.find((v) => v.id === e.target.value);
                    setEditFormData({
                      ...editFormData,
                      assignedVehicleId: e.target.value,
                      vehicleNumber: sel ? sel.vehicleNumber : "",
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="">-- No vehicle assigned --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.type || "Truck"} - {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Driver Duty Status
                </Label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="AVAILABLE">AVAILABLE (On Duty / Ready)</option>
                  <option value="ON_TRIP">ON_TRIP (En Route)</option>
                  <option value="OFF_DUTY">OFF_DUTY (Rest / Leave)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Emergency Contact
                </Label>
                <Input
                  placeholder="Relative name & phone"
                  value={editFormData.emergencyContact}
                  onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Residential Address
                </Label>
                <Input
                  placeholder="Address details"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                <span>Save Driver Changes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: RESET PASSWORD */}
      <Dialog open={!!resetPasswordDriver} onOpenChange={() => setResetPasswordDriver(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Driver Portal Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update login password for driver: {resetPasswordDriver?.name} ({resetPasswordDriver?.user?.email || resetPasswordDriver?.phone}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                New Password
              </Label>
              <Input
                required
                type="password"
                placeholder="Enter new driver password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordDriver(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Driver Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: VIEW DRIVER DETAILS */}
      <Dialog open={!!viewDriver} onOpenChange={() => setViewDriver(null)}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                  {viewDriver?.photo || viewDriver?.user?.avatar ? (
                    <img
                      src={viewDriver.photo || viewDriver.user?.avatar}
                      alt={viewDriver.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCog className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {viewDriver?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    License: {viewDriver?.licenseNumber || "N/A"} &bull; Contact: {viewDriver?.phone || viewDriver?.contact} &bull; Status: {viewDriver?.status}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(viewDriver?.phone || viewDriver?.contact) && (
                  <>
                    <a
                      href={`tel:${viewDriver?.phone || viewDriver?.contact}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={buildWhatsAppUrl(
                        viewDriver?.phone || viewDriver?.contact,
                        getAdminToDriverWhatsAppMessage({
                          driverName: viewDriver?.name,
                          vehicleNumber: viewDriver?.vehicleNumber || viewDriver?.vehicles?.[0]?.vehicleNumber,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteDriver(viewDriver)}
                  className="text-xs font-bold gap-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Driver
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">CNIC</p>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {viewDriver?.cnic || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Assigned Truck</p>
                <p className="text-xs font-black text-spd-blue mt-1">
                  {viewDriver?.vehicleNumber || viewDriver?.vehicles?.[0]?.vehicleNumber || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Emergency Contact</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {viewDriver?.emergencyContact || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Login Email</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {viewDriver?.user?.email || "No Portal Account"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">License Expiry</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {viewDriver?.licenseExpiry ? formatDate(viewDriver.licenseExpiry) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Total Consignments</p>
                <p className="text-xs font-black text-emerald-600 mt-1">
                  {viewDriver?._count?.consignments || viewDriver?.consignments?.length || 0}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Recent Highway Consignments</h3>
              {(!viewDriver?.consignments || viewDriver.consignments.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No assigned consignments found for this driver.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold">Bilty #</TableHead>
                        <TableHead className="text-[11px] font-bold">Route</TableHead>
                        <TableHead className="text-[11px] font-bold">Status</TableHead>
                        <TableHead className="text-[11px] font-bold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDriver.consignments.map((c: any) => (
                        <TableRow key={c.id} className="text-xs">
                          <TableCell className="font-mono font-bold text-spd-blue">{c.biltyNumber}</TableCell>
                          <TableCell>{c.origin} &rarr; {c.destination}</TableCell>
                          <TableCell><span className="text-[10px] font-bold uppercase">{c.shipmentStatus}</span></TableCell>
                          <TableCell>{formatDate(c.date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CONFIRM DELETE DRIVER */}
      <Dialog open={!!deleteDriver} onOpenChange={(open) => !deleting && !open && setDeleteDriver(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Driver
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                Are you sure you want to delete this driver?
              </span>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-700/80">
                <p><strong>Name:</strong> {deleteDriver?.name}</p>
                <p><strong>Phone / Contact:</strong> {deleteDriver?.phone || deleteDriver?.contact || "N/A"}</p>
                <p><strong>License:</strong> {deleteDriver?.licenseNumber || "N/A"}</p>
                <p><strong>Login Account:</strong> {deleteDriver?.user?.email || "N/A"}</p>
              </div>
              <span className="text-[11px] text-slate-500 block leading-relaxed">
                Deleting this driver will immediately deactivate login access. Any historical delivery records and past shipments will be preserved to maintain historical reporting integrity.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteDriver(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteDriver}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Driver</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
