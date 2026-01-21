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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";

export default function AdminPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllLeaves = async () => {
    try {
      const res = await axios.get("/api/admin/leaves");
      setLeaves(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const onUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch("/api/admin/leaves", { id, status });
      toast.success(`Leave request ${status.toLowerCase()}`);
      fetchAllLeaves();
    } catch (error) {
      toast.error("Action failed");
    }
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Panel</h2>
        <p className="text-muted-foreground">Manage employee leave requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                        {leave.user.name}
                        <p className="text-xs text-muted-foreground font-normal">{leave.user.email}</p>
                    </TableCell>
                    <TableCell>{leave.type}</TableCell>
                    <TableCell className="text-xs">
                        {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
                    </TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>
                      <Badge variant={leave.status === "APPROVED" ? "default" : leave.status === "PENDING" ? "secondary" : "destructive"}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {leave.status === "PENDING" && (
                            <>
                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => onUpdateStatus(leave.id, "APPROVED")}>
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => onUpdateStatus(leave.id, "REJECTED")}>
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
        </CardContent>
      </Card>
    </div>
  );
}
