import test from 'node:test';
import assert from 'node:assert/strict';
import {fromCisaKevCacheRows,toCisaKevCacheRows} from '../lib/cisa-kev-cache.mjs';
const catalog={catalogVersion:'2026.11.26',dateReleased:'2026-11-26T00:00:00.000Z',count:2,validatedCount:2,vulnerabilities:[
 {cveID:'CVE-2026-1234',vendorProject:'Vendor A',product:'Product A',vulnerabilityName:'Remote Code Execution',dateAdded:'2026-11-20',shortDescription:'A validated test vulnerability.',requiredAction:'Apply the vendor update.',dueDate:'2026-12-01',knownRansomwareCampaignUse:'Unknown',forensicTriage:'Yes',cwes:['CWE-94'],nvdUrl:'https://nvd.nist.gov/vuln/detail/CVE-2026-1234'},
 {cveID:'CVE-2025-12345',vendorProject:'Vendor B',product:'Product B',vulnerabilityName:'Privilege Escalation',dateAdded:'2025-10-10',shortDescription:'Another validated vulnerability.',requiredAction:'Follow vendor guidance.',dueDate:'2025-11-01',knownRansomwareCampaignUse:null,forensicTriage:null,cwes:[],nvdUrl:'https://nvd.nist.gov/vuln/detail/CVE-2025-12345'}]};
test('maps validated CISA records into the private cache schema',()=>{
 const rows=toCisaKevCacheRows(catalog,'2026-11-26T12:00:00.000Z','https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
 assert.equal(rows.length,2);assert.equal(rows[0].cve_id,'CVE-2026-1234');assert.equal(rows[0].catalog_version,'2026.11.26');assert.equal(rows[0].observed_at,'2026-11-26T12:00:00.000Z');assert.deepEqual(rows[0].cwes,['CWE-94']);
});
test('reconstructs source-attributed records and sorts newest first',()=>{
 const rows=toCisaKevCacheRows(catalog,'2026-11-26T12:00:00.000Z','https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
 const result=fromCisaKevCacheRows(rows,50);assert.deepEqual(result.map((item)=>item.cveID),['CVE-2026-1234','CVE-2025-12345']);assert.equal(result[0].requiredAction,'Apply the vendor update.');assert.equal(result[0].nvdUrl,'https://nvd.nist.gov/vuln/detail/CVE-2026-1234');
});
test('rejects malformed or non-HTTPS cached rows',()=>{
 const rows=toCisaKevCacheRows(catalog,'2026-11-26T12:00:00.000Z','https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
 rows.push({...rows[0],cve_id:'NOT-A-CVE'},{...rows[0],source_url:'http://attacker.example/feed'},{...rows[0],date_added:'tomorrow'},{...rows[0],required_action:''});
 assert.equal(fromCisaKevCacheRows(rows,100).length,2);
});
test('caps item count and filters malformed CWE values',()=>{
 const rows=toCisaKevCacheRows(catalog,'2026-11-26T12:00:00.000Z','https://www.cisa.gov/known-exploited-vulnerabilities-catalog');rows[0].cwes=['CWE-94','DROP TABLE','CWE-287'];
 assert.equal(fromCisaKevCacheRows(rows,1).length,1);assert.deepEqual(fromCisaKevCacheRows(rows,1)[0].cwes,['CWE-94','CWE-287']);
});