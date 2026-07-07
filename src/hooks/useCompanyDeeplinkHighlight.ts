import { useCallback, useEffect, useRef } from "react";
import { Alert, ScrollView, type View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { resolveCompanyById } from "../services/deepLinkResolveService";
import { useListRowHighlight } from "./useListRowHighlight";

type CompanyRow = { id: number; name: string };

/** Grid is two columns; used when layout measure is not ready yet. */
const ESTIMATED_GRID_CELL_HEIGHT = 132;

export function useCompanyDeeplinkHighlight(
  screen: "Exhibitors" | "Partners" | "Startups",
  companyType: "exhibitor" | "partner" | "startup",
  displayedCompanies: CompanyRow[],
  isLoading: boolean,
) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof screen>>();
  const scrollRef = useRef<ScrollView>(null);
  const listHighlight = useListRowHighlight<number>();
  const { clearHighlight, clearHighlightTimers, setHighlightTargetId } =
    listHighlight;
  const highlightIndexRef = useRef(0);

  const openDetail = useCallback(
    (id: number, name?: string) => {
      navigation.navigate("CompanyDetail", {
        exhibitorId: String(id),
        type: companyType,
        name,
      });
    },
    [navigation, companyType],
  );

  listHighlight.scrollToOffsetRef.current = useCallback((y?: number) => {
    scrollRef.current?.scrollTo({ y: y ?? 0, animated: true });
  }, []);

  const registerScrollViewport = useCallback((height: number) => {
    listHighlight.scrollViewportHeightRef.current = height;
  }, [listHighlight]);

  const bindScrollContent = useCallback(
    (node: View | null) => {
      listHighlight.listContentRef.current = node;
    },
    [listHighlight],
  );

  const bindCell = useCallback(
    (id: number, node: View | null) => {
      if (node) {
        listHighlight.rowViewRefs.current.set(id, node);
        listHighlight.measureRowLayout(id, node);
      } else {
        listHighlight.rowViewRefs.current.delete(id);
      }
    },
    [listHighlight],
  );

  const remeasureCell = useCallback(
    (id: number) => {
      const node = listHighlight.rowViewRefs.current.get(id);
      if (node) listHighlight.measureRowLayout(id, node);
    },
    [listHighlight],
  );

  useEffect(() => {
    const raw = route.params?.highlightCompanyId;
    if (!raw) return;
    const companyId = parseInt(raw, 10);
    if (!Number.isFinite(companyId) || companyId <= 0) return;
    listHighlight.rowLayoutRef.current.clear();
    setHighlightTargetId(companyId);
    navigation.setParams({ highlightCompanyId: undefined });
  }, [
    route.params?.highlightCompanyId,
    navigation,
    setHighlightTargetId,
    listHighlight,
  ]);

  useEffect(() => {
    const companyId = listHighlight.highlightTargetId;
    if (companyId == null || isLoading) return;

    const index = displayedCompanies.findIndex((c) => c.id === companyId);
    if (index < 0) {
      let cancelled = false;
      void (async () => {
        const company = await resolveCompanyById(companyId, companyType);
        if (cancelled) return;
        if (!company) {
          const label =
            companyType === "exhibitor"
              ? "exhibitor"
              : companyType === "startup"
                ? "startup"
                : "partner";
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
    }

    clearHighlightTimers();
    highlightIndexRef.current = index;
    const row = displayedCompanies[index];
    const capturedId = companyId;
    const timer = setTimeout(() => {
      setHighlightTargetId(null);
      const gridRow = Math.floor(index / 2);
      const fallbackY = Math.max(
        0,
        gridRow * ESTIMATED_GRID_CELL_HEIGHT +
          ESTIMATED_GRID_CELL_HEIGHT / 2 -
          listHighlight.scrollViewportHeightRef.current / 2,
      );
      const layout = listHighlight.rowLayoutRef.current.get(capturedId);
      if (!layout && index >= 0) {
        listHighlight.scrollToOffsetRef.current?.(fallbackY);
      }
      listHighlight.tryScrollAndHighlight(capturedId, index);
      setTimeout(() => openDetail(row.id, row.name), 400);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    listHighlight.highlightTargetId,
    displayedCompanies,
    isLoading,
    companyType,
    clearHighlightTimers,
    setHighlightTargetId,
    listHighlight,
    openDetail,
  ]);

  useFocusEffect(
    useCallback(() => {
      return () => clearHighlight();
    }, [clearHighlight]),
  );

  return {
    scrollRef,
    registerScrollViewport,
    bindScrollContent,
    bindCell,
    remeasureCell,
    isHighlighted: listHighlight.isHighlighted,
    highlightOpacity: listHighlight.highlightOpacity,
    clearHighlight: listHighlight.clearHighlight,
  };
}
