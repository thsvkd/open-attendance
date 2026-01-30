"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Check,
  X,
  Edit,
  UserPlus,
  Users,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations, useFormatter } from "next-intl";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
}

interface AdminLeave {
  id: string;
  type: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  days: number;
  status: string;
  user: { name: string; email: string };
}

interface AdminAttendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  user: { name: string; email: string };
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState<AdminLeave[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tl = useTranslations("earlyLeave");
  const ta = useTranslations("annualLeave");
  const tp = useTranslations("profile");
  const formatter = useFormatter();

  // Form states for adding/editing user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    role: "USER",
    joinDate: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchAllLeaves = async () => {
    try {
      const res = await axios.get("/api/admin/leaves");
      setLeaves(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const res = await axios.get("/api/admin/attendance");
      setAttendance(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAllLeaves(),
      fetchAllUsers(),
      fetchAllAttendance(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch("/api/admin/leaves", { id, status });
      toast.success(
        status === "APPROVED"
          ? t("leaves.approveSuccess")
          : t("leaves.rejectSuccess"),
      );
      fetchAllLeaves();
    } catch {
      toast.error(t("leaves.actionFailed"));
    }
  };

  const onDeleteAttendance = async (id: string) => {
    try {
      await axios.delete("/api/admin/attendance", { data: { id } });
      toast.success(
        t("attendance.deleteSuccess") || "근태 기록이 삭제되었습니다.",
      );
      fetchAllAttendance();
    } catch {
      toast.error(
        t("attendance.deleteFailed") || "근태 기록 삭제에 실패했습니다.",
      );
    }
  };

  const onDeleteLeave = async (id: string) => {
    try {
      await axios.delete(`/api/admin/leaves/${id}`);
      toast.success(t("leaves.deleteSuccess") || "휴가 기록이 삭제되었습니다.");
      fetchAllLeaves();
    } catch {
      toast.error(t("leaves.deleteFailed") || "휴가 기록 삭제에 실패했습니다.");
    }
  };

  const onAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(tp("passwordMismatch"));
      return;
    }

    try {
      await axios.post("/api/admin/users", formData);
      toast.success(t("members.addSuccess"));
      setIsAddUserOpen(false);
      fetchAllUsers();
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        currentPassword: "",
        role: "USER",
        joinDate: format(new Date(), "yyyy-MM-dd"),
      });
    } catch {
      toast.error(t("members.addFailed"));
    }
  };

  const onEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(tp("passwordMismatch"));
      return;
    }

    try {
      await axios.patch("/api/admin/users", {
        id: editingUser!.id,
        ...formData,
      });
      toast.success(t("members.updateSuccess"));
      setEditingUser(null);
      fetchAllUsers();
    } catch {
      toast.error(t("members.updateFailed"));
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Keep password empty unless changing
      confirmPassword: "",
      currentPassword: "",
      role: user.role || "USER",
      joinDate: format(new Date(user.joinDate), "yyyy-MM-dd"),
    });
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance" className="flex items-center gap-x-2">
            <CalendarDays className="h-4 w-4" />
            {t("tabs.attendance") || "근무 기록"}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-x-2">
            <CalendarDays className="h-4 w-4" />
            {t("tabs.leaves")}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-x-2">
            <Users className="h-4 w-4" />
            {t("tabs.members")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabs.attendance") || "근무 기록"}</CardTitle>
              <CardDescription>
                {t("attendance.description") || "직원 근무 기록 관리"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.employee")}</TableHead>
                      <TableHead>{t("attendance.date") || "날짜"}</TableHead>
                      <TableHead>
                        {t("attendance.checkIn") || "체크인"}
                      </TableHead>
                      <TableHead>
                        {t("attendance.checkOut") || "체크아웃"}
                      </TableHead>
                      <TableHead>{t("attendance.status") || "상태"}</TableHead>
                      <TableHead className="text-right">
                        {tc("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          {t("attendance.noRecords") || "근무 기록이 없습니다"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance.map((record: AdminAttendance) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.user.name}
                            <p className="text-xs text-muted-foreground font-normal">
                              {record.user.email}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(record.date), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.checkIn
                              ? format(new Date(record.checkIn), "HH:mm:ss")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.checkOut
                              ? format(new Date(record.checkOut), "HH:mm:ss")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              statusType="attendance"
                              status={record.status}
                              label={
                                t(`attendance.statuses.${record.status}`) ||
                                record.status
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onDeleteAttendance(record.id)}
                              title={t("attendance.delete") || "삭제"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {attendance.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t("attendance.noRecords") || "근무 기록이 없습니다"}
                  </div>
                ) : (
                  attendance.map((record: AdminAttendance) => (
                    <Card key={record.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {record.user.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {record.user.email}
                              </div>
                            </div>
                            <Badge
                              statusType="attendance"
                              status={record.status}
                              label={
                                t(`attendance.statuses.${record.status}`) ||
                                record.status
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("attendance.date") || "날짜"}
                              </span>
                              <span className="font-medium">
                                {format(new Date(record.date), "yyyy-MM-dd")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("attendance.checkIn") || "체크인"}
                              </span>
                              <span className="font-medium">
                                {record.checkIn
                                  ? format(new Date(record.checkIn), "HH:mm:ss")
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("attendance.checkOut") || "체크아웃"}
                              </span>
                              <span className="font-medium">
                                {record.checkOut
                                  ? format(
                                      new Date(record.checkOut),
                                      "HH:mm:ss",
                                    )
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => onDeleteAttendance(record.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("attendance.delete") || "삭제"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("leaves.title")}</CardTitle>
              <CardDescription>{t("leaves.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.employee")}</TableHead>
                      <TableHead>{tl("type")}</TableHead>
                      <TableHead>{tl("dates")}</TableHead>
                      <TableHead>{tl("days")}</TableHead>
                      <TableHead>{tl("status")}</TableHead>
                      <TableHead className="text-right">
                        {tc("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          {t("leaves.noRequests")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.map((leave: AdminLeave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.user.name}
                            <p className="text-xs text-muted-foreground font-normal">
                              {leave.user.email}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div>
                              {tl(`types.${leave.type}`)}
                              {leave.type === "ANNUAL" &&
                                leave.leaveType &&
                                leave.leaveType !== "FULL_DAY" && (
                                  <p className="text-xs text-muted-foreground">
                                    {ta(`leaveTypes.${leave.leaveType}`)}
                                    {leave.leaveType === "QUARTER_DAY" &&
                                      leave.startTime &&
                                      leave.endTime && (
                                        <span className="block">
                                          {leave.startTime} - {leave.endTime}
                                        </span>
                                      )}
                                  </p>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {leave.leaveType === "FULL_DAY" ||
                            !leave.leaveType ? (
                              <>
                                {format(new Date(leave.startDate), "MM/dd")} -{" "}
                                {format(new Date(leave.endDate), "MM/dd")}
                              </>
                            ) : (
                              format(new Date(leave.startDate), "MM/dd")
                            )}
                          </TableCell>
                          <TableCell>{leave.days}</TableCell>
                          <TableCell>
                            <Badge
                              statusType="leave"
                              status={leave.status}
                              label={tl(`statuses.${leave.status}`)}
                            />
                          </TableCell>
                          <TableCell className="text-right space-x-2 min-w-[140px]">
                            {leave.status === "PENDING" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    onUpdateStatus(leave.id, "APPROVED")
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    onUpdateStatus(leave.id, "REJECTED")
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {leave.status !== "PENDING" && (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDeleteLeave(leave.id)}
                                title={t("leaves.delete") || "삭제"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {leaves.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t("leaves.noRequests")}
                  </div>
                ) : (
                  leaves.map((leave: AdminLeave) => (
                    <Card key={leave.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {leave.user.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {leave.user.email}
                              </div>
                            </div>
                            <Badge
                              statusType="leave"
                              status={leave.status}
                              label={tl(`statuses.${leave.status}`)}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {tl("type")}
                              </span>
                              <div className="text-right">
                                <div className="font-medium">
                                  {tl(`types.${leave.type}`)}
                                </div>
                                {leave.type === "ANNUAL" &&
                                  leave.leaveType &&
                                  leave.leaveType !== "FULL_DAY" && (
                                    <div className="text-xs text-muted-foreground">
                                      {ta(`leaveTypes.${leave.leaveType}`)}
                                      {leave.leaveType === "QUARTER_DAY" &&
                                        leave.startTime &&
                                        leave.endTime && (
                                          <div>
                                            {leave.startTime} - {leave.endTime}
                                          </div>
                                        )}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {tl("dates")}
                              </span>
                              <span className="font-medium">
                                {leave.leaveType === "FULL_DAY" ||
                                !leave.leaveType ? (
                                  <>
                                    {format(new Date(leave.startDate), "MM/dd")}{" "}
                                    - {format(new Date(leave.endDate), "MM/dd")}
                                  </>
                                ) : (
                                  format(new Date(leave.startDate), "MM/dd")
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {tl("days")}
                              </span>
                              <span className="font-medium">{leave.days}</span>
                            </div>
                          </div>
                          {leave.status === "PENDING" && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                onClick={() =>
                                  onUpdateStatus(leave.id, "APPROVED")
                                }
                              >
                                <Check className="mr-1 h-4 w-4" />
                                {t("leaves.approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() =>
                                  onUpdateStatus(leave.id, "REJECTED")
                                }
                              >
                                <X className="mr-1 h-4 w-4" />
                                {t("leaves.reject")}
                              </Button>
                            </div>
                          )}
                          {leave.status !== "PENDING" && (
                            <div className="pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => onDeleteLeave(leave.id)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                {t("leaves.delete") || "삭제"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-x-2">
                  <UserPlus className="h-4 w-4" />
                  {t("members.addMember")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onAddUser}>
                  <DialogHeader>
                    <DialogTitle>{t("members.addMember")}</DialogTitle>
                    <DialogDescription>
                      {t("members.form.details")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t("members.form.name")}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t("members.form.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">
                        {t("members.form.password")}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">
                        {tp("confirmNewPassword")}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">{t("members.form.role")}</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(v: string) =>
                          setFormData({ ...formData, role: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("members.form.selectRole")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">
                            {tc("roles.USER")}
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            {tc("roles.ADMIN")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="joinDate">
                          {t("members.form.joinDate")}
                        </Label>
                        {!editingUser?.joinDate && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            {t("members.joinDateNotSet")}
                          </Badge>
                        )}
                      </div>
                      <DatePickerField
                        label=""
                        selected={
                          formData.joinDate
                            ? new Date(formData.joinDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            joinDate: date
                              ? format(date, "yyyy-MM-dd")
                              : format(new Date(), "yyyy-MM-dd"),
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{t("members.form.submitAdd")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("members.title")}</CardTitle>
              <CardDescription>{t("members.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.employee")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.joinedAt")}</TableHead>
                      <TableHead className="text-right">
                        {tc("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          {t("members.noMembers")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: AdminUser) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              statusType="role"
                              status={user.role || "USER"}
                              label={tc(`roles.${user.role || "USER"}`)}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.joinDate ? (
                              formatter.dateTime(new Date(user.joinDate), {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            ) : (
                              <span className="text-red-600 font-medium">
                                {t("members.joinDateNotSet")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t("members.noMembers")}
                  </div>
                ) : (
                  users.map((user: AdminUser) => (
                    <Card key={user.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("table.role")}
                              </span>
                              <Badge
                                statusType="role"
                                status={user.role || "USER"}
                                label={tc(`roles.${user.role || "USER"}`)}
                              />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {t("table.joinedAt")}
                              </span>
                              <span className="font-medium text-right">
                                {user.joinDate ? (
                                  formatter.dateTime(new Date(user.joinDate), {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                ) : (
                                  <span className="text-red-600">
                                    {t("members.joinDateNotSet")}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t("members.edit")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open: boolean) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={onEditUser}>
            <DialogHeader>
              <DialogTitle>{t("members.editMember")}</DialogTitle>
              <DialogDescription>{t("members.form.details")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("members.form.name")}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t("members.form.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              {editingUser?.id === session?.user?.id && formData.password && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-currentPassword">
                    {tp("currentPassword")}
                  </Label>
                  <Input
                    id="edit-currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder={tp("currentPassword")}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-password">{tp("newPassword")}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={t("members.form.passwordHint")}
                />
              </div>
              {formData.password && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-confirmPassword">
                    {tp("confirmNewPassword")}
                  </Label>
                  <Input
                    id="edit-confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder={tp("confirmNewPassword")}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-role">{t("members.form.role")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v: string) =>
                    setFormData({ ...formData, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("members.form.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">{tc("roles.USER")}</SelectItem>
                    <SelectItem value="ADMIN">{tc("roles.ADMIN")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-joinDate">
                    {t("members.form.joinDate")}
                  </Label>
                  {!editingUser?.joinDate && (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      {t("members.joinDateNotSet")}
                    </Badge>
                  )}
                </div>
                <DatePickerField
                  label=""
                  selected={
                    formData.joinDate ? new Date(formData.joinDate) : undefined
                  }
                  onSelect={(date) =>
                    setFormData({
                      ...formData,
                      joinDate: date
                        ? format(date, "yyyy-MM-dd")
                        : format(new Date(), "yyyy-MM-dd"),
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("members.form.submitEdit")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
