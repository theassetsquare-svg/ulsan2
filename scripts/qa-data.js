// 나이트 문답 사전 — 40개 업소 데이터 병합
// 확인일 2026-08-16 · 공개 웹 정보 기준 · 미확인 항목은 문자열 '확인 불가'
'use strict';

const PARTS = [1, 2, 3, 4, 5]
  .map(i => { try { return require(`./qa-data-${i}.js`); } catch (e) { return []; } });

const VENUES = [].concat(...PARTS).map((v, i) => ({ n: i + 1, ...v }));

module.exports = { VENUES, D: '2026년 8월 16일', UNK: '확인 불가' };
