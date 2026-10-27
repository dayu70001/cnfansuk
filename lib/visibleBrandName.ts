/** Keep the public brand's visible casing consistent without touching metadata. */
export function formatVisibleBrandName(value: string) {
  return value.replaceAll("CNFans UK", "CNFANS UK").replaceAll("CNFans", "CNFANS");
}
