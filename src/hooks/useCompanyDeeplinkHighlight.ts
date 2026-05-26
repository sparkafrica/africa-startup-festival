import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { resolveCompanyById } from "../services/deepLinkResolveService";

type CompanyRow = { id: number; name: string };

export function useCompanyDeeplinkHighlight(
  screen: "Exhibitors" | "Partners",
  companyType: "exhibitor" | "partner",
  companies: CompanyRow[],
  isLoading: boolean,
): number | null {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof screen>>();
  const [pulseCompanyId, setPulseCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const raw = route.params?.highlightCompanyId;
    if (!raw || isLoading) return;

    const companyId = parseInt(raw, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) return;

    navigation.setParams({ highlightCompanyId: undefined });

    const openDetail = (id: number, name?: string) => {
      navigation.navigate("CompanyDetail", {
        exhibitorId: String(id),
        type: companyType,
        name,
      });
    };

    const row = companies.find((c) => c.id === companyId);
    if (row) {
      setPulseCompanyId(companyId);
      const timer = setTimeout(() => {
        setPulseCompanyId(null);
        openDetail(row.id, row.name);
      }, 400);
      return () => clearTimeout(timer);
    }

    let cancelled = false;
    void (async () => {
      const company = await resolveCompanyById(companyId, companyType);
      if (cancelled) return;
      if (!company) {
        const label = companyType === "exhibitor" ? "exhibitor" : "partner";
        Alert.alert(
          "Not found",
          `Could not find this ${label}. Check the link or try again.`,
        );
        return;
      }
      openDetail(company.id, company.name ?? undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    route.params?.highlightCompanyId,
    isLoading,
    companies,
    navigation,
    companyType,
  ]);

  return pulseCompanyId;
}
