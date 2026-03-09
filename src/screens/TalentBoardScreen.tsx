import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { CloseIcon, ChevronRightIcon } from "../components/MenuIcons";
import { LoadingSpinner } from "../components";
import { jobService, type CompanyJobs, type JobItem } from "../services/jobService";
import { ApiClientError } from "../services/api";
import { colors, borderRadius, shadows, typography, spacing } from "../theme/theme";

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Talent Board</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
        hitSlop={10}
      >
        <CloseIcon size={20} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}

function JobRow({ job }: { job: JobItem }) {
  const openLink = async () => {
    if (!job.link?.trim()) return;
    try {
      const url = job.link.trim();
      const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      await Linking.openURL(formatted);
    } catch {
      Alert.alert("Cannot Open Link", "This link could not be opened.");
    }
  };

  const typeLabel = job.type === "active_role" ? "Role" : "Job";

  return (
    <Pressable
      onPress={openLink}
      style={({ pressed }) => [styles.jobRow, pressed && styles.jobRowPressed]}
    >
      <View style={styles.jobRowContent}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {job.title}
        </Text>
        <View style={styles.jobMeta}>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{typeLabel}</Text>
          </View>
          <ChevronRightIcon size={16} color={colors.neutral[500]} />
        </View>
      </View>
    </Pressable>
  );
}

function CompanyCard({ company }: { company: CompanyJobs }) {
  const displayName = company.company_name || `Company ${company.company_id}`;
  const companyType = company.company_type
    ? company.company_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.companyName} numberOfLines={2}>
          {displayName}
        </Text>
        {companyType ? (
          <View style={styles.companyTypePill}>
            <Text style={styles.companyTypePillText}>{companyType}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.jobList}>
        {company.jobs && company.jobs.length > 0 ? (
          company.jobs.map((job, idx) => (
            <JobRow key={`${job.title}-${idx}`} job={job} />
          ))
        ) : (
          <Text style={styles.noJobsText}>No roles listed</Text>
        )}
      </View>
    </View>
  );
}

export default function TalentBoardScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [companies, setCompanies] = useState<CompanyJobs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    console.warn("[TalentBoard] fetchJobs start", { isRefresh });
    try {
      const list = await jobService.getJobsForEvent();
      console.warn("[TalentBoard] fetchJobs success", { count: list?.length ?? 0 });
      setCompanies(list ?? []);
    } catch (err: any) {
      const status = err?.response?.status ?? err?.response_code ?? err?.responseCode;
      const responseData = err?.response?.data ?? err?.data;
      console.warn("[TalentBoard] fetchJobs error (check if 401 triggers logout)", {
        message: err?.message,
        status,
        response_code: err?.response_code ?? err?.responseCode,
        responseData: typeof responseData === "object" ? JSON.stringify(responseData) : responseData,
        is401: status === 401 || err?.response_code === 401 || err?.responseCode === 401,
      });
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load job listings. Pull to retry.";
      setError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredCompanies = searchLower
    ? companies.filter((c) => {
        const nameMatch = (c.company_name || "").toLowerCase().includes(searchLower);
        const typeMatch = (c.company_type || "").toLowerCase().includes(searchLower);
        const jobMatch = (c.jobs || []).some((j) =>
          (j.title || "").toLowerCase().includes(searchLower)
        );
        return nameMatch || typeMatch || jobMatch;
      })
    : companies;

  const onRefresh = useCallback(() => {
    fetchJobs(true);
  }, [fetchJobs]);

  const hasJobs = companies.some((c) => c.jobs && c.jobs.length > 0);
  const hasFilteredJobs = filteredCompanies.some((c) => c.jobs && c.jobs.length > 0);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <Header />

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies or roles..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.centered}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Loading job listings...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchJobs()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : !hasJobs ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No job listings yet</Text>
            <Text style={styles.emptySubtext}>
              Check back later for open roles and job postings from exhibitors and partners.
            </Text>
          </View>
        ) : !hasFilteredJobs ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term or pull to refresh.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={onRefresh}
                tintColor="#1BB273"
                colors={["#1BB273"]}
              />
            }
          >
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.company_id} company={company} />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-bold"],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[5],
    overflow: "hidden",
    ...shadows.base,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  companyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  companyTypePill: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  companyTypePillText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  jobList: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  jobRowPressed: {
    opacity: 0.7,
  },
  jobRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  jobTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginRight: spacing[2],
    fontFamily: typography.fontFamily.sans,
  },
  jobMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  typePill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typePillText: {
    fontSize: 11,
    color: colors.primary[700],
    fontFamily: typography.fontFamily["inter-medium"],
  },
  noJobsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    paddingVertical: spacing[3],
    fontFamily: typography.fontFamily.sans,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing[4],
    fontFamily: typography.fontFamily.sans,
  },
  retryButton: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing[2],
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    fontFamily: typography.fontFamily.sans,
  },
});
