import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentRule, getAvailableRoutes, RULES_VERIFIED_ON } from "../../lib/document-rules.js";

test("known route returns official source and verification date",()=>{
 const rule=getDocumentRule("Canada","passport-paper");
 assert.equal(rule.verifiedOn,RULES_VERIFIED_ON);
 assert.match(rule.sourceUrl,/^https:\/\//);
 assert.equal(rule.officialExportBlocked,true);
});
test("unverified country or route never receives a guessed fallback",()=>{
 assert.equal(getDocumentRule("France","passport-paper"),null);
 assert.equal(getDocumentRule("India","visa-digital"),null);
 assert.equal(getDocumentRule("", ""),null);
});
test("route list is limited to entries for selected country",()=>{
 const routes=getAvailableRoutes("United States");
 assert.equal(routes.length,3);
 assert.ok(routes.some(item=>item.route==="visa-digital"));
 assert.equal(getAvailableRoutes("Unknown").length,0);
});
test("unaltered-photo and no-photo routes block official export",()=>{
 assert.equal(getDocumentRule("India","passport-psk-adult").officialExportBlocked,true);
 for (const [country,route] of [
  ["United States","passport-paper"],["United States","passport-online"],
  ["United Kingdom","passport-digital"],["United Kingdom","passport-paper"],
  ["Canada","passport-paper"],["Canada","passport-online"]
 ]) assert.equal(getDocumentRule(country,route).officialExportBlocked,true);
});
