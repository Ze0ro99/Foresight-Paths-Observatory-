import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeThreatAndGenerateBundle,
  computeFeeEconomicsStrategies,
  DEFAULT_PLAN_PRICE_PI,
} from './pi-ecosystem-engine';

test('fee strategy catalogue makes no unsupported fixed-fee or savings claims', () => {
  const strategies = computeFeeEconomicsStrategies();
  assert.equal(DEFAULT_PLAN_PRICE_PI, 0.0001);
  assert.ok(strategies.length >= 5);
  assert.ok(strategies.every((strategy) => strategy.effectiveGasRatioPct === null));
  assert.ok(strategies.some((strategy) => strategy.id === 'direct-onchain' && strategy.readinessStatusAr.includes('Testnet v1')));
  assert.ok(strategies.some((strategy) => strategy.id === 'x402-batch' && strategy.readinessStatusAr.includes('غير مفعّل')));
});

test('scenario generator exports explicitly unverified MCP/Soroban scaffolds and a simulate-only Pi subscription spec', () => {
  const bundle = analyzeThreatAndGenerateBundle({
    title: 'PHP2Shell Critical Gateway Exploit',
    threatCategory: 'web_exploit',
    severity: 9,
    probabilityPct: 75,
    dependencyFactor: 8,
    estimatedUsdCost: 1200,
    piUsdMedianPrice: 0.6,
    oracleSpreadPct: 2.1,
  });

  assert.equal(bundle.riskLevel, 'critical');
  assert.equal(bundle.oracleStatus, 'healthy');
  assert.ok(bundle.estimatedPiCost > 2000);
  assert.ok(bundle.precautionarySteps.length >= 3);
  assert.ok(bundle.mcpAgentCode.includes('READ-ONLY AGENT STARTER TEMPLATE'));
  assert.ok(bundle.mcpAgentCode.includes('paymentSubmission: false'));
  assert.ok(!bundle.mcpAgentCode.includes('createX402McpServer'));
  assert.ok(bundle.sorobanContractCode.includes('authorize_pirc2'));
  assert.ok(bundle.soloHostManifest.includes('solohost.pi.agent-design/v1'));
  assert.ok(bundle.subscriptionSpecJson.includes('Pi Native Subscription Contract v1'));
  assert.ok(bundle.subscriptionSpecJson.includes('"submitModeEnabled": false'));
  assert.ok(bundle.subscriptionSpecJson.includes('"priceIsIllustrative": true'));
  assert.ok(bundle.subscriptionSpecJson.includes('"x402Integration": "not_implemented"'));
  assert.ok(!bundle.subscriptionSpecJson.includes('batch-settlement'));
});

test('manual scenario spread produces a model warning without claiming a live oracle action', () => {
  const bundle = analyzeThreatAndGenerateBundle({
    title: 'Oracle Spread Shock',
    threatCategory: 'payment_liquidity',
    severity: 7,
    probabilityPct: 60,
    dependencyFactor: 6,
    estimatedUsdCost: 500,
    piUsdMedianPrice: 0.5,
    oracleSpreadPct: 6.2,
  });

  assert.equal(bundle.oracleStatus, 'spread_warning');
  assert.ok(bundle.sorobanContractCode.includes('circuit_halted: true'));
  assert.ok(bundle.agentsMarkdown.includes('not a live quote'));
});
