# 🔧 LABEL FIXES NEEDED

Mapping actual page titles to nav config labels that need to be updated:

---

## VENDOR Module Changes

| Nav Config Label | Actual Page Title | Fix |
|---|---|---|
| Vendor List | "Vendor Profiles" | Change to "Vendor Profiles" |
| Material Mapping | "Raw Material Catalog Mapping" | Change to "Raw Material Catalog" |
| Documents | "Vendor Document Management" | Change to "Contract Documents" |
| Invoices | "Invoice Management" | Change to "Invoice Management" |
| Price Comparison | "Vendor Price Comparison" | ✅ Already matches |
| Rating | "Vendor Rating & Performance" | Change to "Vendor Rating" |
| Communication Log | "Vendor Communication Log" | ✅ Already matches |
| Reorder Management | "Reorder Management" | ✅ Already matches |

---

## Changes to Make in src/app/dashboard/actions.ts

```typescript
// VENDOR MODULE
- { href: "/dashboard/vendor/list", label: "Vendor List", ... }
+ { href: "/dashboard/vendor/list", label: "Vendor Profiles", ... }

- { href: "/dashboard/vendor/material-mapping", label: "Material Mapping", ... }
+ { href: "/dashboard/vendor/material-mapping", label: "Raw Material Catalog", ... }

- { href: "/dashboard/vendor/documents", label: "Documents", ... }
+ { href: "/dashboard/vendor/documents", label: "Contract Documents", ... }

- { href: "/dashboard/vendor/invoices", label: "Invoices", ... }
+ { href: "/dashboard/vendor/invoices", label: "Invoice Management", ... }

- { href: "/dashboard/vendor/rating", label: "Rating", ... }
+ { href: "/dashboard/vendor/rating", label: "Vendor Rating", ... }
```

---

## Ready to Apply?

YES → I'll update the vendor section in actions.ts
