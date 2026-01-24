"use client"

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2, Check, X, Plus, Edit, UserPlus, Users, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations, useFormatter } from "next-intl";

export default function AdminPage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
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

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAllLeaves(), fetchAllUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch("/api/admin/leaves", { id, status });
      toast.success(status === "APPROVED" ? t('leaves.approveSuccess') : t('leaves.rejectSuccess'));
      fetchAllLeaves();
    } catch (error) {
      toast.error(t('leaves.actionFailed'));
    }
  };

  const onAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/admin/users", formData);
      toast.success(t('members.addSuccess'));
      setIsAddUserOpen(false);
      fetchAllUsers();
      setFormData({ name: "", email: "", password: "", currentPassword: "", role: "USER", joinDate: format(new Date(), "yyyy-MM-dd") });
    } catch (error) {
      toast.error(t('members.addFailed'));
    }
  };

  const onEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch("/api/admin/users", { id: editingUser.id, ...formData });
      toast.success(t('members.updateSuccess'));
      setEditingUser(null);
      fetchAllUsers();
    } catch (error) {
      toast.error(t('members.updateFailed'));
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Keep password empty unless changing
      currentPassword: "",
      role: user.role || "USER",
      joinDate: format(new Date(user.joinDate), "yyyy-MM-dd"),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <Tabs defaultValue="leaves" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaves" className="flex items-center gap-x-2">
            <CalendarDays className="h-4 w-4" />
            {t('tabs.leaves')}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-x-2">
            <Users className="h-4 w-4" />
            {t('tabs.members')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('leaves.title')}</CardTitle>
              <CardDescription>{t('leaves.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.employee')}</TableHead>
                      <TableHead>{tl('type')}</TableHead>
                      <TableHead>{tl('dates')}</TableHead>
                      <TableHead>{tl('days')}</TableHead>
                      <TableHead>{tl('status')}</TableHead>
                      <TableHead className="text-right">{tc('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {t('leaves.noRequests')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.map((leave: any) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.user.name}
                            <p className="text-xs text-muted-foreground font-normal">{leave.user.email}</p>
                          </TableCell>
                          <TableCell>
                            <div>
                              {tl(`types.${leave.type}`)}
                              {leave.type === "ANNUAL" && leave.leaveType && leave.leaveType !== "FULL_DAY" && (
                                <p className="text-xs text-muted-foreground">
                                  {ta(`leaveTypes.${leave.leaveType}`)}
                                  {leave.leaveType === "QUARTER_DAY" && leave.startTime && leave.endTime && (
                                    <span className="block">{leave.startTime} - {leave.endTime}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {leave.leaveType === "FULL_DAY" || !leave.leaveType ? (
                              <>
                                {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
                              </>
                            ) : (
                              format(new Date(leave.startDate), "MM/dd")
                            )}
                          </TableCell>
                          <TableCell>{leave.days}</TableCell>
                          <TableCell>
                            <Badge statusType="leave" status={leave.status} label={tl(`statuses.${leave.status}`)} />
                          </TableCell>
                          <TableCell className="text-right space-x-2 min-w-[120px]">{leave.status === "PENDING" && (
                            <>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onUpdateStatus(leave.id, "APPROVED")}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onUpdateStatus(leave.id, "REJECTED")}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
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
                    {t('leaves.noRequests')}
                  </div>
                ) : (
                  leaves.map((leave: any) => (
                    <Card key={leave.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{leave.user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{leave.user.email}</div>
                            </div>
                            <Badge statusType="leave" status={leave.status} label={tl(`statuses.${leave.status}`)} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{tl('type')}</span>
                              <div className="text-right">
                                <div className="font-medium">{tl(`types.${leave.type}`)}</div>
                                {leave.type === "ANNUAL" && leave.leaveType && leave.leaveType !== "FULL_DAY" && (
                                  <div className="text-xs text-muted-foreground">
                                    {ta(`leaveTypes.${leave.leaveType}`)}
                                    {leave.leaveType === "QUARTER_DAY" && leave.startTime && leave.endTime && (
                                      <div>{leave.startTime} - {leave.endTime}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{tl('dates')}</span>
                              <span className="font-medium">
                                {leave.leaveType === "FULL_DAY" || !leave.leaveType ? (
                                  <>
                                    {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
                                  </>
                                ) : (
                                  format(new Date(leave.startDate), "MM/dd")
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{tl('days')}</span>
                              <span className="font-medium">{leave.days}</span>
                            </div>
                          </div>
                          {leave.status === "PENDING" && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                onClick={() => onUpdateStatus(leave.id, "APPROVED")}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                {t('leaves.approve')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => onUpdateStatus(leave.id, "REJECTED")}
                              >
                                <X className="mr-1 h-4 w-4" />
                                {t('leaves.reject')}
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
                  {t('members.addMember')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onAddUser}>
                  <DialogHeader>
                    <DialogTitle>{t('members.addMember')}</DialogTitle>
                    <DialogDescription>
                      {t('members.form.details')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t('members.form.name')}</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t('members.form.email')}</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">{t('members.form.password')}</Label>
                      <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">{t('members.form.role')}</Label>
                      <Select value={formData.role} onValueChange={(v: string) => setFormData({ ...formData, role: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('members.form.selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="joinDate">{t('members.form.joinDate')}</Label>
                      <Input id="joinDate" type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{t('members.form.submitAdd')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('members.title')}</CardTitle>
              <CardDescription>{t('members.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.employee')}</TableHead>
                      <TableHead>{t('table.role')}</TableHead>
                      <TableHead>{t('table.joinedAt')}</TableHead>
                      <TableHead className="text-right">{tc('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {t('members.noMembers')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge statusType="role" status={user.role || "USER"} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatter.dateTime(new Date(user.joinDate), {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
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
                    {t('members.noMembers')}
                  </div>
                ) : (
                  users.map((user: any) => (
                    <Card key={user.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('table.role')}</span>
                              <Badge statusType="role" status={user.role || "USER"} />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('table.joinedAt')}</span>
                              <span className="font-medium text-right">
                                {formatter.dateTime(new Date(user.joinDate), {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
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
                              {t('members.edit')}
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
      <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={onEditUser}>
            <DialogHeader>
              <DialogTitle>{t('members.editMember')}</DialogTitle>
              <DialogDescription>
                {t('members.form.details')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t('members.form.name')}</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t('members.form.email')}</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              {editingUser?.id === session?.user?.id && formData.password && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-currentPassword">{tp('currentPassword')}</Label>
                  <Input
                    id="edit-currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder={tp('currentPassword')}
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-password">{t('members.form.password')} ({t('members.form.passwordHint')})</Label>
                <Input id="edit-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">{t('members.form.role')}</Label>
                <Select value={formData.role} onValueChange={(v: string) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('members.form.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-joinDate">{t('members.form.joinDate')}</Label>
                <Input id="edit-joinDate" type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t('members.form.submitEdit')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
