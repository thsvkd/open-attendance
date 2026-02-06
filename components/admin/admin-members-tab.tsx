"use client";

import { useState } from "react";
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
import { Edit, UserPlus } from "lucide-react";
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
import { DatePickerField } from "@/components/ui/date-picker-field";
import { useTranslations, useFormatter } from "next-intl";
import { useSession } from "next-auth/react";
import type { AdminUser } from "@/types/admin";

interface AdminMembersTabProps {
  users: AdminUser[];
  onRefresh: () => void;
}

export function AdminMembersTab({ users, onRefresh }: AdminMembersTabProps) {
  const { data: session } = useSession();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const formatter = useFormatter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    role: "USER",
    joinDate: format(new Date(), "yyyy-MM-dd"),
  });

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
      onRefresh();
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
      onRefresh();
    } catch {
      toast.error(t("members.updateFailed"));
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      currentPassword: "",
      role: user.role || "USER",
      joinDate: format(new Date(user.joinDate), "yyyy-MM-dd"),
    });
  };

  return (
    <>
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
                  <Label htmlFor="password">{t("members.form.password")}</Label>
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
                  <TableHead className="text-center">
                    {t("table.role")}
                  </TableHead>
                  <TableHead>{t("table.joinedAt")}</TableHead>
                  <TableHead className="text-center">{tc("actions")}</TableHead>
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
                      <TableCell className="text-center">
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
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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
    </>
  );
}
