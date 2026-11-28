const CVE_PATTERN=/^CVE-[0-9]{4}-[0-9]{4,19}$/;
const DATE_PATTERN=/^\d{4}-\d{2}-\d{2}$/;
export function toCisaKevCacheRows(catalog,observedAt,sourceUrl){
 if(!catalog||!Array.isArray(catalog.vulnerabilities))return [];
 return catalog.vulnerabilities.map((item)=>({
  cve_id:item.cveID,vendor_project:item.vendorProject,product:item.product,vulnerability_name:item.vulnerabilityName,
  date_added:item.dateAdded,short_description:item.shortDescription,required_action:item.requiredAction,due_date:item.dueDate,
  known_ransomware_campaign_use:item.knownRansomwareCampaignUse,forensic_triage:item.forensicTriage,cwes:item.cwes,
  catalog_version:catalog.catalogVersion,catalog_date_released:catalog.dateReleased,source_url:sourceUrl,observed_at:observedAt,
 }));
}
export function fromCisaKevCacheRows(rows,limit=50){
 if(!Array.isArray(rows))return [];
 const safeLimit=Number.isInteger(limit)?Math.max(1,Math.min(100,limit)):50,unique=new Map();
 for(const row of rows){
  if(!row||typeof row!=='object')continue;
  const cveID=typeof row.cve_id==='string'?row.cve_id.toUpperCase():'';
  const dateAdded=typeof row.date_added==='string'?row.date_added:'',dueDate=typeof row.due_date==='string'?row.due_date:'';
  const dateReleased=typeof row.catalog_date_released==='string'?row.catalog_date_released:'';
  if(!CVE_PATTERN.test(cveID)||!DATE_PATTERN.test(dateAdded)||!DATE_PATTERN.test(dueDate)||!Number.isFinite(Date.parse(dateReleased))||!Number.isFinite(Date.parse(String(row.observed_at||'')))||typeof row.source_url!=='string'||!row.source_url.startsWith('https://'))continue;
  if(['vendor_project','product','vulnerability_name','short_description','required_action'].some((key)=>typeof row[key]!=='string'||!row[key].trim()))continue;
  const ransomware=row.known_ransomware_campaign_use==='Known'||row.known_ransomware_campaign_use==='Unknown'?row.known_ransomware_campaign_use:null;
  const forensic=row.forensic_triage==='Yes'||row.forensic_triage==='No'?row.forensic_triage:null;
  const cwes=Array.isArray(row.cwes)?row.cwes.filter((value)=>typeof value==='string'&&/^CWE-[0-9]+$/.test(value)).slice(0,20):[];
  unique.set(cveID,{cveID,vendorProject:row.vendor_project,product:row.product,vulnerabilityName:row.vulnerability_name,dateAdded,shortDescription:row.short_description,requiredAction:row.required_action,dueDate,knownRansomwareCampaignUse:ransomware,forensicTriage:forensic,cwes,nvdUrl:'https://nvd.nist.gov/vuln/detail/'+cveID});
 }
 return [...unique.values()].sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)||a.cveID.localeCompare(b.cveID)).slice(0,safeLimit);
}