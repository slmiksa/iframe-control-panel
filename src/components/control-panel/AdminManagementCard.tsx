
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Admin = {
  id?: string;
  username: string;
};

type AdminManagementCardProps = {
  admins: Admin[];
  addAdmin: (username: string, password: string) => Promise<boolean>;
  removeAdmin: (username: string) => Promise<boolean>;
  isLoading: boolean;
};

export const AdminManagementCard: React.FC<AdminManagementCardProps> = ({
  admins,
  addAdmin,
  removeAdmin,
  isLoading,
}) => {
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminUsername || !newAdminPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingAdmin(true);
    
    try {
      const added = await addAdmin(newAdminUsername, newAdminPassword);
      
      if (added) {
        toast({
          title: "تم بنجاح",
          description: "تمت إضافة المسؤول بنجاح",
        });
        setNewAdminUsername("");
        setNewAdminPassword("");
      } else {
        toast({
          title: "خطأ",
          description: "اسم المستخدم موجود بالفعل",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المسؤول",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };
  
  const handleRemoveAdmin = async (username: string) => {
    if (username === "admin") {
      toast({
        title: "خطأ",
        description: "لا يمكن حذف المسؤول الافتراضي",
        variant: "destructive",
      });
      return;
    }
    
    setIsRemovingAdmin(true);
    
    try {
      const removed = await removeAdmin(username);
      if (removed) {
        toast({
          title: "تم بنجاح",
          description: "تم حذف المسؤول بنجاح",
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف المسؤول",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المسؤول",
        variant: "destructive",
      });
    } finally {
      setIsRemovingAdmin(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
        <CardDescription>إضافة وإدارة مستخدمي لوحة التحكم</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="admin-username" className="font-medium">اسم المستخدم</label>
                <Input
                  id="admin-username"
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="اسم المستخدم الجديد"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="admin-password" className="font-medium">كلمة المرور</label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="كلمة المرور"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full md:w-auto" disabled={isAddingAdmin}>
                  {isAddingAdmin ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                  إضافة مسؤول جديد
                </Button>
              </div>
            </div>
          </form>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      لا يوجد مسؤولين
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id || admin.username}>
                      <TableCell>{admin.username}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.username)}
                          disabled={admin.username === "admin" || isRemovingAdmin}
                        >
                          {isRemovingAdmin ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
