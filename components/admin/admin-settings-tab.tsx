"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface AdminSettingsTabProps {
  initialCountry: string;
}

export function AdminSettingsTab({ initialCountry }: AdminSettingsTabProps) {
  const [companyCountry, setCompanyCountry] = useState(initialCountry);
  const [isSavingCountry, setIsSavingCountry] = useState(false);
  const t = useTranslations("admin");

  const saveCompanyCountry = async () => {
    setIsSavingCountry(true);
    try {
      await axios.patch("/api/admin/company-settings", {
        country: companyCountry,
      });
      toast.success(t("settings.saved") || "설정이 저장되었습니다.");
    } catch {
      toast.error(t("settings.saveFailed") || "설정 저장에 실패했습니다.");
    } finally {
      setIsSavingCountry(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.settings") || "회사 설정"}</CardTitle>
        <CardDescription>
          {t("settings.description") || "회사 전체 설정을 관리합니다"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Country Setting */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="country">
              {t("settings.country") || "공휴일 계산 국가"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t("settings.countryDescription") ||
                "연차 소모일 계산 시 적용할 국가를 선택하세요. 해당 국가의 공휴일이 자동으로 제외됩니다."}
            </p>
          </div>
          <Select value={companyCountry} onValueChange={setCompanyCountry}>
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="국가 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KR">🇰🇷 South Korea</SelectItem>
              <SelectItem value="US">🇺🇸 United States</SelectItem>
              <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="JP">🇯🇵 Japan</SelectItem>
              <SelectItem value="CN">🇨🇳 China</SelectItem>
              <SelectItem value="DE">🇩🇪 Germany</SelectItem>
              <SelectItem value="FR">🇫🇷 France</SelectItem>
              <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
              <SelectItem value="AU">🇦🇺 Australia</SelectItem>
              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={saveCompanyCountry}
          disabled={isSavingCountry}
          className="w-full"
        >
          {isSavingCountry
            ? t("settings.saving") || "저장 중..."
            : t("settings.save") || "저장"}
        </Button>

        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p>
            {t("settings.note") ||
              "이 설정은 회사 전체에 적용됩니다. 모든 직원의 연차 소모일 계산에 선택한 국가의 공휴일이 반영됩니다."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
