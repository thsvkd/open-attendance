"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, CalendarDays, Settings } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { AdminAttendanceTab } from "@/components/admin/admin-attendance-tab";
import { AdminLeavesTab } from "@/components/admin/admin-leaves-tab";
import { AdminMembersTab } from "@/components/admin/admin-members-tab";
import { AdminSettingsTab } from "@/components/admin/admin-settings-tab";
import type { AdminUser, AdminLeave, AdminAttendance } from "@/types/admin";

export default function AdminPage() {
  const [leaves, setLeaves] = useState<AdminLeave[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyCountry, setCompanyCountry] = useState("KR");
  const t = useTranslations("admin");

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

  const fetchCompanySettings = async () => {
    try {
      const res = await axios.get("/api/admin/company-settings");
      setCompanyCountry(res.data.country || "KR");
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
      fetchCompanySettings(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <TabsTrigger value="settings" className="flex items-center gap-x-2">
            <Settings className="h-4 w-4" />
            {t("tabs.settings") || "설정"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <AdminAttendanceTab
            attendance={attendance}
            onRefresh={fetchAllAttendance}
          />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <AdminLeavesTab leaves={leaves} onRefresh={fetchAllLeaves} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <AdminMembersTab users={users} onRefresh={fetchAllUsers} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AdminSettingsTab initialCountry={companyCountry} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
