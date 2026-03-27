/**
 * 한전 송전선로 여유용량 데이터 - SQLite DB 기반
 * ================================================
 * server.py가 SQLite에서 즉시 데이터를 반환합니다.
 * 데이터 수집은 collector.py가 백그라운드에서 처리합니다.
 */

let substations = [];
let osmPowerlines = [];
let regions = [];
let stats = {};
let dataLoaded = false;

// ─── API 호출 ───

async function loadAllData() {
  const statusEl = document.querySelector('#loading-screen p');

  try {
    // 1) 변전소 데이터 (DB에서 즉시)
    if (statusEl) statusEl.textContent = '변전소 데이터를 불러오는 중...';
    const substRes = await fetch('/kepco-grid-v2/api/substations');
    if (!substRes.ok) throw new Error('변전소 데이터 로드 실패');
    const substData = await substRes.json();
    substations = substData.substations.map(s => ({
      id: s.subst_cd,
      name: s.subst_nm,
      region: s.metro_nm || '미분류',
      metroCd: s.metro_cd,
      lat: s.lat,
      lng: s.lng,
      capacityMW: s.js_subst_pwr || (s.vol1 + s.subst_pwr),
      usedMW: s.subst_pwr,
      availableMW: s.vol1,
      availableRate: s.available_rate,
      status: s.status,
      transformerCount: s.transformer_count,
      dlCount: s.dl_count,
      totalDlPwr: s.total_dl_pwr,
      totalVol3: s.total_vol3,
      hasLocation: s.has_location === 1
    }));

    // 2) 송전선 경로 (DB에서 즉시)
    if (statusEl) statusEl.textContent = '송전선 경로 데이터를 불러오는 중...';
    try {
      const plRes = await fetch('/kepco-grid-v2/api/powerlines');
      if (plRes.ok) {
        const plData = await plRes.json();
        osmPowerlines = plData.powerlines || [];
      }
    } catch (e) {
      console.warn('[Data] 송전선 경로 로딩 실패:', e);
      osmPowerlines = [];
    }

    // 3) 지역 목록
    const regRes = await fetch('/kepco-grid-v2/api/regions');
    if (regRes.ok) {
      const regData = await regRes.json();
      regions = regData.regions.map(r => r.metro_nm);
    }

    // 4) 통계
    const statRes = await fetch('/kepco-grid-v2/api/substations/stats');
    if (statRes.ok) {
      stats = await statRes.json();
    }

    dataLoaded = true;
    console.log(`[Data] 로드 완료: 변전소 ${substations.length}개, 송전선 ${osmPowerlines.length}개`);
    return true;

  } catch (error) {
    console.error('[Data] 로드 실패:', error);
    if (statusEl) {
      statusEl.innerHTML = `데이터 로드 실패: ${error.message}<br><br>
        <span style="color: #666;">1. 먼저 <code style="background:#eee;padding:2px 6px;border-radius:3px;">python collector.py</code> 실행<br>
        2. 그 다음 <code style="background:#eee;padding:2px 6px;border-radius:3px;">python server.py</code> 실행</span>`;
    }
    throw error;
  }
}

// ─── 검색 API ───

async function searchSubstations(query) {
  const res = await fetch(`/kepco-grid-v2/api/substations/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results.map(r => ({
    id: r.subst_cd,
    name: r.subst_nm,
    region: r.metro_nm,
    status: r.status,
    availableMW: r.vol1,
    availableRate: r.available_rate,
    lat: r.lat,
    lng: r.lng
  }));
}

// ─── 유틸리티 ───

function getStatusColor(status) {
  switch (status) {
    case '여유': return '#16a34a';
    case '보통': return '#ca8a04';
    case '주의': return '#ea580c';
    case '포화': return '#dc2626';
    default: return '#6b7280';
  }
}

function getStatusBg(status) {
  switch (status) {
    case '여유': return '#dcfce7';
    case '보통': return '#fef9c3';
    case '주의': return '#ffedd5';
    case '포화': return '#fef2f2';
    default: return '#f3f4f6';
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case '여유': return '🟢';
    case '보통': return '🟡';
    case '주의': return '🟠';
    case '포화': return '🔴';
    default: return '⚪';
  }
}

function getSubstationById(id) {
  return substations.find(ss => ss.id === id);
}
