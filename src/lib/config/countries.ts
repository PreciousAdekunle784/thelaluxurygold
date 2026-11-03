// ISO 3166-1 alpha-2 codes. Names are resolved with Intl.DisplayNames so the list stays compact.
const CODES =
  "AE SA QA KW BH OM GB US NG FR DE IT ES NL BE CH AT IE PT SE NO DK FI PL CZ GR TR EG MA ZA KE GH IN PK BD LK SG MY ID TH PH VN HK CN JP KR AU NZ CA MX BR AR CL CO PE AF AL DZ AD AO AG AM AZ BS BB BY BZ BJ BT BO BA BW BN BG BF BI CV KH CM CF TD KM CG CD CR CI HR CU CY DJ DM DO EC SV GQ ER EE SZ ET FJ GA GM GE GD GT GN GW GY HT HN HU IS IQ IL JM JO KZ KI XK KG LA LV LB LS LR LY LI LT LU MG MW MV ML MT MH MR MU FM MD MC MN ME MZ MM NA NR NP NI NE MK PW PS PA PG PY RO RU RW KN LC VC WS SM ST SN RS SC SL SK SI SB SO SS SD SR SY TW TJ TZ TL TG TO TT TN TM TV UG UA UY UZ VU VA VE YE ZM ZW".split(" ");

let cache: { code: string; name: string }[] | null = null;

export function countries() {
  if (cache) return cache;
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    dn = null;
  }
  const list = CODES.map((code) => ({ code, name: dn?.of(code) ?? code }));
  const pinned = ["AE"];
  const rest = list.filter((c) => !pinned.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name));
  cache = [...list.filter((c) => pinned.includes(c.code)), ...rest];
  return cache;
}

export function countryName(code: string) {
  return countries().find((c) => c.code === code)?.name ?? code;
}
