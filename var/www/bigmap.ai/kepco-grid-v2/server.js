/**
 * 한전 송전선로 여유용량 지도 - 프록시 서버
 * ============================================
 * KEPCO API 및 OSM Overpass API의 CORS 제한을 해결하는 프록시 서버
 */

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8888;

// 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ──────────────────────────────────────
//  설정
// ──────────────────────────────────────
const KEPCO_API_KEY = 'Gmw7q8ORZt43XLdY2Nwsuh27xKe7brj73IbUq9kQ';
const KEPCO_BASE_URL = 'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// 캐시 (메모리)
const cache = {
    kepcoData: null,
    kepcoTimestamp: 0,
    osmData: null,
    osmTimestamp: 0
};
const CACHE_DURATION = 30 * 60 * 1000; // 30분

// ──────────────────────────────────────
//  KEPCO API 프록시
// ──────────────────────────────────────

// 전국 변전소 여유용량 데이터 조회
app.get('/api/dgen', async (req, res) => {
    try {
        const { metroCd, cityCd, substCd, pageNo, numOfRows } = req.query;

        const params = new URLSearchParams({
            apiKey: KEPCO_API_KEY,
            returnType: 'json'
        });

        if (metroCd) params.append('metroCd', metroCd);
        if (cityCd) params.append('cityCd', cityCd);
        if (substCd) params.append('substCd', substCd);
        if (pageNo) params.append('pageNo', pageNo);
        if (numOfRows) params.append('numOfRows', numOfRows);

        const url = `${KEPCO_BASE_URL}?${params.toString()}`;
        console.log(`[KEPCO] Fetching: metroCd=${metroCd || 'ALL'}, cityCd=${cityCd || 'ALL'}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KEPCO-TransmissionMap/1.0',
                'Accept': 'application/json'
            },
            timeout: 15000
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[KEPCO] API Error:', error.message);
        res.status(500).json({ error: 'KEPCO API 호출 실패', message: error.message });
    }
});

// 전국 모든 변전소 데이터를 수집 (시도코드별로 순차 호출)
app.get('/api/dgen/all', async (req, res) => {
    try {
        // 캐시 확인
        if (cache.kepcoData && (Date.now() - cache.kepcoTimestamp) < CACHE_DURATION) {
            console.log('[KEPCO] Serving from cache');
            return res.json(cache.kepcoData);
        }

        // 시도코드 목록 (common_codes.json에서 metroCd)
        const metroCodes = [
            '11', '26', '27', '28', '29', '30', '31',
            '36', '41', '42', '43', '44', '45', '46', '47', '48', '50'
        ];
        // 11:서울, 26:부산, 27:대구, 28:인천, 29:광주, 30:대전, 31:울산
        // 36:세종, 41:경기, 42:강원, 43:충북, 44:충남, 45:전북, 46:전남, 47:경북, 48:경남, 50:제주

        console.log('[KEPCO] Fetching all metro areas...');
        const allData = [];

        for (const metroCd of metroCodes) {
            try {
                const url = `${KEPCO_BASE_URL}?apiKey=${KEPCO_API_KEY}&returnType=json&metroCd=${metroCd}&numOfRows=10000`;
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'KEPCO-TransmissionMap/1.0' },
                    timeout: 15000
                });
                const data = await response.json();
                if (data.data && Array.isArray(data.data)) {
                    allData.push(...data.data);
                    console.log(`  metroCd=${metroCd}: ${data.data.length} records`);
                }
            } catch (err) {
                console.error(`  metroCd=${metroCd}: Error - ${err.message}`);
            }
        }

        // 변전소별로 그룹핑 (같은 변전소에 여러 변압기/DL이 있으므로)
        const substationMap = {};
        allData.forEach(item => {
            const key = item.substCd;
            if (!substationMap[key]) {
                substationMap[key] = {
                    substCd: item.substCd,
                    substNm: item.substNm,
                    jsSubstPwr: Number(item.jsSubstPwr) || 0,
                    substPwr: Number(item.substPwr) || 0,
                    vol1: Number(item.vol1) || 0,
                    transformers: [],
                    dls: []
                };
            }
            // 변압기 정보 추가 (중복 제거)
            const mtrKey = `${item.mtrNo}`;
            if (!substationMap[key].transformers.find(t => t.mtrNo === mtrKey)) {
                substationMap[key].transformers.push({
                    mtrNo: mtrKey,
                    jsMtrPwr: Number(item.jsMtrPwr) || 0,
                    mtrPwr: Number(item.mtrPwr) || 0,
                    vol2: Number(item.vol2) || 0
                });
            }
            // DL(배전선) 정보 추가
            substationMap[key].dls.push({
                dlCd: item.dlCd,
                dlNm: item.dlNm,
                jsDlPwr: Number(item.jsDlPwr) || 0,
                dlPwr: Number(item.dlPwr) || 0,
                vol3: Number(item.vol3) || 0
            });
        });

        const result = {
            totalRecords: allData.length,
            substations: Object.values(substationMap),
            substationCount: Object.keys(substationMap).length,
            timestamp: new Date().toISOString()
        };

        // 캐시 저장
        cache.kepcoData = result;
        cache.kepcoTimestamp = Date.now();

        console.log(`[KEPCO] Total: ${allData.length} records, ${result.substationCount} substations`);
        res.json(result);
    } catch (error) {
        console.error('[KEPCO] All data fetch error:', error.message);
        res.status(500).json({ error: 'KEPCO 전체 데이터 수집 실패', message: error.message });
    }
});

// ──────────────────────────────────────
//  OSM Overpass API 프록시 (송전선로 경로)
// ──────────────────────────────────────
app.get('/api/powerlines', async (req, res) => {
    try {
        // 캐시 확인
        if (cache.osmData && (Date.now() - cache.osmTimestamp) < CACHE_DURATION) {
            console.log('[OSM] Serving from cache');
            return res.json(cache.osmData);
        }

        // 한반도 범위에서 345kV, 154kV 송전선 + 변전소 조회
        const query = `
      [out:json][timeout:60];
      (
        way["power"="line"]["voltage"~"345000|154000"](33.0,124.5,38.6,131.0);
        node["power"="substation"](33.0,124.5,38.6,131.0);
      );
      out body;
      >;
      out skel qt;
    `;

        console.log('[OSM] Fetching power lines and substations from Overpass API...');
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
            timeout: 90000
        });

        const data = await response.json();

        // 노드 위치 맵 생성
        const nodeMap = {};
        const substations = [];

        data.elements.forEach(el => {
            if (el.type === 'node') {
                nodeMap[el.id] = { lat: el.lat, lon: el.lon };
                if (el.tags && el.tags.power === 'substation') {
                    substations.push({
                        id: el.id,
                        name: el.tags.name || el.tags['name:ko'] || '',
                        lat: el.lat,
                        lon: el.lon,
                        voltage: el.tags.voltage || '',
                        operator: el.tags.operator || ''
                    });
                }
            }
        });

        // 송전선 경로 생성
        const powerlines = [];
        data.elements.forEach(el => {
            if (el.type === 'way' && el.tags && el.tags.power === 'line') {
                const coords = el.nodes
                    .map(nid => nodeMap[nid])
                    .filter(n => n);

                if (coords.length > 0) {
                    powerlines.push({
                        id: el.id,
                        name: el.tags.name || el.tags['name:ko'] || '',
                        voltage: el.tags.voltage || '',
                        cables: el.tags.cables || '',
                        operator: el.tags.operator || '',
                        coords: coords.map(c => [c.lat, c.lon])
                    });
                }
            }
        });

        const result = {
            powerlines,
            substations,
            powerlineCount: powerlines.length,
            substationCount: substations.length,
            timestamp: new Date().toISOString()
        };

        // 캐시 저장
        cache.osmData = result;
        cache.osmTimestamp = Date.now();

        console.log(`[OSM] Found ${powerlines.length} power lines, ${substations.length} substations`);
        res.json(result);
    } catch (error) {
        console.error('[OSM] Overpass API Error:', error.message);
        res.status(500).json({ error: 'OSM 데이터 조회 실패', message: error.message });
    }
});

// ──────────────────────────────────────
//  공통코드 (캐시된 파일)
// ──────────────────────────────────────
app.get('/api/codes', (req, res) => {
    try {
        const codesPath = path.join(__dirname, 'common_codes.json');
        const data = JSON.parse(fs.readFileSync(codesPath, 'utf-8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: '공통코드 로드 실패' });
    }
});

// ──────────────────────────────────────
//  캐시 초기화
// ──────────────────────────────────────
app.get('/api/cache/clear', (req, res) => {
    cache.kepcoData = null;
    cache.kepcoTimestamp = 0;
    cache.osmData = null;
    cache.osmTimestamp = 0;
    console.log('[Cache] Cleared');
    res.json({ message: '캐시가 초기화되었습니다' });
});

// ──────────────────────────────────────
//  서버 시작
// ──────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  ⚡ 한전 송전선로 여유용량 지도 서버');
    console.log('  ─────────────────────────────────');
    console.log(`  🌐 http://localhost:${PORT}`);
    console.log('  📡 KEPCO API 프록시: /api/dgen');
    console.log('  🗺️  OSM 송전선 경로: /api/powerlines');
    console.log('  📋 공통코드: /api/codes');
    console.log('');
});
