/**
 * Founder helpers aligned with Spark EMS Founder / FounderRequest.
 *
 * Persistence strategy:
 * - Always write `metadata.founders` (name, role, email, linkedin, profile_pic) so
 *   the app can display founders reliably even if nested FounderRequest fails.
 * - Also send top-level `founders` (FounderRequest) when email is present — EMS schema.
 * - Never send `founders: []` unless the admin intentionally cleared every founder.
 */

export type FounderFormEntry = {
  id: string;
  name: string;
  role: string;
  email: string;
  linkedIn: string;
  /** Local image URI for new/changed photo (not yet uploaded). */
  imageUri: string | null;
  /** Existing remote/data profile_pic from the API or metadata. */
  imageUrl: string | null;
};

export type FounderRequestPayload = {
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  linkedin?: string;
  profile_pic?: string | null;
};

export type FounderDisplay = {
  id: string;
  name: string;
  role: string;
  linkedInUrl: string;
  imageUrl: string | null;
};

export type MetadataFounder = {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  profile_pic?: string | null;
};

export function splitFounderName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function validateFounderEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Founder email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid founder email";
  }
  return null;
}

function ensureHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function normalizeEmail(email: unknown): string {
  return (email ?? "").toString().trim().toLowerCase();
}

function extractEmail(f: any): string {
  return normalizeEmail(f?.email);
}

function extractProfilePic(f: any): string | null {
  if (typeof f?.profile_pic === "string" && f.profile_pic.trim()) {
    return f.profile_pic.trim();
  }
  if (typeof f?.imageUrl === "string" && f.imageUrl.trim()) {
    return f.imageUrl.trim();
  }
  return null;
}

function mapOneFounder(f: any, i: number): FounderDisplay | null {
  const first = (f?.first_name ?? "").toString().trim();
  const last = (f?.last_name ?? "").toString().trim();
  const name =
    `${first} ${last}`.trim() ||
    (f?.name ?? "").toString().trim() ||
    "";
  const role = (f?.job_title ?? f?.role ?? "").toString().trim();
  const linkedInRaw = (f?.linkedin ?? f?.linkedIn ?? "").toString().trim();
  const pic = extractProfilePic(f);
  if (!name && !role) return null;
  const email = extractEmail(f);
  return {
    // Prefer email as stable id so React keys / merges survive reorder.
    id: email || String(f?.id ?? `founder-${i}`),
    name: name || "Founder",
    role,
    linkedInUrl: linkedInRaw ? ensureHttps(linkedInRaw) : "",
    imageUrl: pic,
  };
}

/**
 * Prefer metadata.founders when present — that is where this app stores the
 * full founder row including profile_pic, so photos stay paired with the right
 * person across add/remove/reorder.
 * Fall back to API founders when metadata has none.
 */
export function normalizeFoundersForDisplay(input: {
  founders?: unknown;
  metadata?: Record<string, unknown> | null;
}): FounderDisplay[] {
  const meta = input.metadata ?? {};
  const metaFounders = Array.isArray(meta.founders) ? meta.founders : [];
  const apiFounders = Array.isArray(input.founders) ? input.founders : [];

  if (metaFounders.length > 0) {
    return metaFounders
      .map((f: any, i: number) => mapOneFounder(f, i))
      .filter(Boolean) as FounderDisplay[];
  }

  if (apiFounders.length > 0) {
    return apiFounders
      .map((f: any, i: number) => mapOneFounder(f, i))
      .filter(Boolean) as FounderDisplay[];
  }

  return [];
}

/** Map API/metadata founders into editable form rows. */
export function foundersToFormEntries(input: {
  founders?: unknown;
  metadata?: Record<string, unknown> | null;
}): FounderFormEntry[] {
  const displayed = normalizeFoundersForDisplay(input);
  if (displayed.length === 0) {
    return [
      {
        id: `founder-${Date.now()}`,
        name: "",
        role: "",
        email: "",
        linkedIn: "",
        imageUri: null,
        imageUrl: null,
      },
    ];
  }

  const metaList = Array.isArray(input.metadata?.founders)
    ? (input.metadata!.founders as any[])
    : [];
  const apiFounders = Array.isArray(input.founders) ? input.founders : [];

  return displayed.map((d, i) => {
    // Prefer the same source row normalizeFoundersForDisplay used.
    const meta = metaList[i];
    const api =
      apiFounders.find(
        (f: any) => extractEmail(f) && extractEmail(f) === normalizeEmail(d.id),
      ) ?? apiFounders[i];
    const email = (
      meta?.email ??
      (api as any)?.email ??
      (d.id.includes("@") ? d.id : "") ??
      ""
    ).toString();
    return {
      id: d.id,
      name: d.name,
      role: d.role,
      email,
      linkedIn: d.linkedInUrl,
      imageUri: null,
      imageUrl: d.imageUrl,
    };
  });
}

/**
 * Build save payloads from form rows.
 * - metadataFounders: always written (includes photos as data URLs when available)
 * - apiFounders: only complete EMS rows (email required); omit entirely if none
 */
export async function buildFounderSavePayloads(
  founders: FounderFormEntry[],
  readImageAsBase64Fn: (uri: string) => Promise<string | null>,
): Promise<{
  metadataFounders: MetadataFounder[];
  apiFounders: FounderRequestPayload[];
  validationError: string | null;
}> {
  const started = founders.filter(
    (f) =>
      f.name.trim() ||
      f.role.trim() ||
      f.email.trim() ||
      f.linkedIn.trim() ||
      f.imageUri ||
      f.imageUrl,
  );

  if (started.length === 0) {
    return { metadataFounders: [], apiFounders: [], validationError: null };
  }

  for (let i = 0; i < started.length; i++) {
    const f = started[i];
    if (!f.name.trim() || f.name.trim().length < 2) {
      return {
        metadataFounders: [],
        apiFounders: [],
        validationError: `Founder ${i + 1}: name is required`,
      };
    }
    if (!f.role.trim()) {
      return {
        metadataFounders: [],
        apiFounders: [],
        validationError: `Founder ${i + 1}: role is required`,
      };
    }
    const emailErr = validateFounderEmail(f.email);
    if (emailErr) {
      return {
        metadataFounders: [],
        apiFounders: [],
        validationError: `Founder ${i + 1}: ${emailErr}`,
      };
    }
    if (!f.linkedIn.trim()) {
      return {
        metadataFounders: [],
        apiFounders: [],
        validationError: `Founder ${i + 1}: LinkedIn is required`,
      };
    }
  }

  const metadataFounders: MetadataFounder[] = [];
  const apiFounders: FounderRequestPayload[] = [];

  for (const f of started) {
    let profile_pic: string | null | undefined = f.imageUrl ?? undefined;
    if (f.imageUri) {
      profile_pic = (await readImageAsBase64Fn(f.imageUri)) ?? profile_pic;
    }
    const { first_name, last_name } = splitFounderName(f.name);
    metadataFounders.push({
      name: f.name.trim(),
      role: f.role.trim(),
      email: f.email.trim(),
      linkedin: f.linkedIn.trim(),
      ...(profile_pic ? { profile_pic } : {}),
    });
    apiFounders.push({
      first_name: first_name || f.name.trim(),
      last_name: last_name || "-",
      email: f.email.trim(),
      job_title: f.role.trim(),
      linkedin: f.linkedIn.trim(),
      // Nested binary often fails on JSON PATCH — photos live in metadata for display.
    });
  }

  return { metadataFounders, apiFounders, validationError: null };
}
