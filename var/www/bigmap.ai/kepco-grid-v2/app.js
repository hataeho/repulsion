/**
 * 한전 송전선로 여유용량 지도 - 메인 애플리케이션
 * ================================================
 * 실제 KEPCO API + OSM Overpass API 데이터 사용
 */

// ──────────────────────────────────────
//  전역 변수
// ──────────────────────────────────────
let map;
let substationMarkers = [];
let osmPolylines = [];
let activeFilters = {
  status: "all",
  voltage: "all",
  region: "all"
};

// ──────────────────────────────────────
//  초기화 (비동기)
// ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initMap();
  initSidebar();

  try {
    // 실제 API 데이터 로드 (data.js의 loadAllData)
    await loadAllData();

    // 데이터 렌더링
    renderSubstations();
    renderOsmPowerlines();
    updateStats();
    initFilters();
    initSearch();

    // 로딩 완료 후 스크린 제거
    setTimeout(() => {
      const loader = document.getElementById("loading-screen");
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 600);
    }, 300);
  } catch (error) {
    console.error("초기화 실패:", error);
    // 로딩 화면에 에러 표시
    const loader = document.getElementById("loading-screen");
    const content = loader.querySelector(".loading-content");
    content.innerHTML = `
      <div style="color: #ff1744; font-size: 1.5rem;">⚠️ 데이터 로드 실패</div>
      <p style="margin-top: 1rem;">${error.message}</p>
      <p style="margin-top: 0.5rem; color: #aaa;">
        서버가 실행 중인지 확인하세요:<br>
        <code style="background: #333; padding: 4px 8px; border-radius: 4px;">python server.py</code>
      </p>
      <button onclick="location.reload()" style="margin-top: 1rem; padding: 8px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer;">
        다시 시도
      </button>
    `;
  }
});

// ──────────────────────────────────────
//  지도 초기화
// ──────────────────────────────────────
function initMap() {
  map = L.map("map", {
    center: [36.3, 127.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 18,
    zoomControl: false
  });

  // 지도 레이어
  const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  });

  // 위성 레이어
  const satLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: '&copy; Esri, Maxar, Earthstar',
    maxZoom: 18
  });

  // 위성 위에 지명 라벨 오버레이
  const labelsLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
    subdomains: 'abcd', maxZoom: 19, pane: 'overlayPane'
  });

  // 위성+라벨 그룹
  const satWithLabels = L.layerGroup([satLayer, labelsLayer]);

  // 기본은 지도
  osmLayer.addTo(map);

  // 레이어 전환 컨트롤
  L.control.layers({
    "🗺️ 지도": osmLayer,
    "🛰️ 위성+지명": satWithLabels
  }, null, { position: "topright" }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);

  // 주소 검색 초기화
  initAddressSearch();
}

// ──────────────────────────────────────
//  주소/지명 검색 (Nominatim)
// ──────────────────────────────────────
function initAddressSearch() {
  const input = document.getElementById('addr-input');
  const btn = document.getElementById('addr-search-btn');
  const results = document.getElementById('addr-results');

  const doSearch = async () => {
    const q = input.value.trim();
    if (!q) return;
    results.innerHTML = '<div style="padding:8px;color:#888;font-size:0.8rem;">검색중...</div>';
    results.style.display = 'block';

    try {
      // 1차: 원문 + 대한민국 접두사
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('대한민국 ' + q)}&format=json&limit=5&accept-language=ko`;
      let res = await fetch(url);
      let data = await res.json();

      // 2차: 결과 없으면 원문만
      if (data.length === 0) {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=kr&limit=5&accept-language=ko`;
        res = await fetch(url);
        data = await res.json();
      }

      // 3차: 그래도 없으면 첫 단어만
      if (data.length === 0 && q.includes(' ')) {
        const first = q.split(' ')[0];
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('대한민국 ' + first)}&format=json&limit=5&accept-language=ko`;
        res = await fetch(url);
        data = await res.json();
      }

      if (data.length === 0) {
        results.innerHTML = '<div style="padding:8px;color:#888;font-size:0.8rem;">결과 없음 — 시/군 이름을 추가해보세요</div>';
        results.style.display = 'block';
        return;
      }

      results.innerHTML = data.map(r => `
        <div class="search-result-item" style="padding:6px 8px;cursor:pointer;border-bottom:1px solid #f1f5f9;font-size:0.78rem;"
             data-lat="${r.lat}" data-lng="${r.lon}">
          <strong>${r.display_name.split(',')[0]}</strong>
          <div style="color:#94a3b8;font-size:0.68rem;">${r.display_name.substring(0, 60)}</div>
        </div>
      `).join('');

      results.style.display = 'block';

      results.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const lat = parseFloat(el.dataset.lat);
          const lng = parseFloat(el.dataset.lng);

          if (window._addrMarker) map.removeLayer(window._addrMarker);
          window._addrMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: '',
              html: '<div style="background:#ef4444;color:#fff;padding:3px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;white-space:nowrap;">\ud83d\udccd ' + el.querySelector('strong').textContent + '</div>',
              iconAnchor: [50, 30]
            })
          }).addTo(map);

          map.flyTo([lat, lng], 14);
          results.style.display = 'none';
        });
        el.addEventListener('mouseover', () => el.style.background = '#f1f5f9');
        el.addEventListener('mouseout', () => el.style.background = '');
      });
    } catch (err) {
      results.innerHTML = '<div style="padding:8px;color:#ef4444;font-size:0.8rem;">검색 실패: ' + err.message + '</div>';
    }
  };

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

//  변전소 마커 렌더링 (KEPCO API 데이터)
// ──────────────────────────────────────
//  변전소 마커 — 전국 여유용량 한눈에 보기
//  크기 = 여유용량 비례, 색상 = 상태
// ──────────────────────────────────────
function renderSubstations() {
  substationMarkers.forEach(m => map.removeLayer(m.marker));
  substationMarkers = [];

  const maxVol = Math.max(...substations.map(s => s.availableMW || 0), 1);

  substations.forEach(ss => {
    if (!ss.lat || !ss.lng) return;

    const color = getStatusColor(ss.status);
    const vol = ss.availableMW || 0;
    const radius = Math.max(8, Math.min(40, 8 + (vol / maxVol) * 32));

    const marker = L.circleMarker([ss.lat, ss.lng], {
      radius: radius,
      fillColor: color,
      fillOpacity: 0.55,
      color: color,
      weight: 1.5,
      opacity: 0.8
    });

    marker.bindPopup(() => createSubstationPopup(ss), {
      maxWidth: 280, className: "custom-popup"
    });

    marker.on("mouseover", function () {
      this.setStyle({ fillOpacity: 0.9, weight: 3 });
    });
    marker.on("mouseout", function () {
      this.setStyle({ fillOpacity: 0.55, weight: 1.5 });
    });
    marker.on("click", function () {
      this.openPopup();
      showDetailPanel(ss);
    });

    marker.bindTooltip(`${ss.name} ${vol > 0 ? Number(vol).toLocaleString() + 'kW' : '포화'}`, {
      permanent: false, direction: 'top', className: 'capacity-tooltip'
    });

    substationMarkers.push({ marker, data: ss });
    marker.addTo(map);
  });
}

function createSubstationPopup(ss) {
  const color = getStatusColor(ss.status);
  const total = ss.availableMW + ss.usedMW;
  const usagePercent = total > 0 ? ((ss.usedMW / total) * 100).toFixed(1) : '0';

  return `
    <div class="popup-header">
      ${getStatusEmoji(ss.status)} ${ss.name}
    </div>
    <div class="popup-status-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
      ${ss.status} · 여유 ${ss.availableRate}%
    </div>
    <div style="margin-top: 10px;">
      <div class="popup-info-row">
        <span class="popup-info-label">지역</span>
        <span class="popup-info-value">${ss.region}</span>
      </div>
      <div class="popup-info-row">
        <span class="popup-info-label">변전소코드</span>
        <span class="popup-info-value">${ss.id}</span>
      </div>
      <div class="popup-info-row">
        <span class="popup-info-label">누적 연계용량</span>
        <span class="popup-info-value">${Number(ss.usedMW).toLocaleString()} kW</span>
      </div>
      <div class="popup-info-row">
        <span class="popup-info-label">여유 용량</span>
        <span class="popup-info-value" style="color: ${color}; font-weight: 700;">${Number(ss.availableMW).toLocaleString()} kW</span>
      </div>
      <div class="popup-info-row">
        <span class="popup-info-label">변압기</span>
        <span class="popup-info-value">${ss.transformerCount}대</span>
      </div>
      <div class="popup-info-row">
        <span class="popup-info-label">배전선(DL)</span>
        <span class="popup-info-value">${ss.dlCount}개</span>
      </div>
    </div>
    <div class="popup-capacity-bar">
      <div class="popup-capacity-fill" style="width: ${usagePercent}%; background: linear-gradient(90deg, ${color}, ${color}cc);"></div>
    </div>
    <div class="popup-capacity-text">사용률 ${usagePercent}%</div>
    <div style="margin-top:6px;font-size:0.7rem;color:#888;">📡 실제 KEPCO API 데이터</div>
  `;
}

// ──────────────────────────────────────
//  OSM 송전선로 렌더링 (실제 경로)
// ──────────────────────────────────────
function renderOsmPowerlines() {
  osmPolylines.forEach(p => map.removeLayer(p.polyline));
  osmPolylines = [];

  osmPowerlines.forEach(pl => {
    if (!pl.coords || pl.coords.length < 2) return;

    const is345 = pl.voltage && pl.voltage.includes('345000');
    const color = is345 ? '#b388ff' : '#80deea';
    const weight = is345 ? 2.5 : 1.5;

    const polyline = L.polyline(pl.coords, {
      color: color,
      weight: weight,
      opacity: 0.6,
      dashArray: is345 ? null : "6, 4",
      lineCap: "round",
      lineJoin: "round"
    });

    polyline.bindPopup(() => createPowerlinePopup(pl), {
      maxWidth: 280,
      className: "custom-popup"
    });

    polyline.on("mouseover", function () {
      this.setStyle({ weight: weight + 2, opacity: 1 });
      this.bringToFront();
    });

    polyline.on("mouseout", function () {
      this.setStyle({ weight: weight, opacity: 0.6 });
    });

    osmPolylines.push({ polyline, data: pl });
    polyline.addTo(map);
  });
}

function createPowerlinePopup(pl) {
  const voltageKV = pl.voltage ? (parseInt(pl.voltage) / 1000) + 'kV' : '미상';
  return `
    <div class="popup-header">⚡ 송전선로</div>
    <div style="margin-top: 10px;">
      ${pl.name ? `<div class="popup-info-row">
        <span class="popup-info-label">선로명</span>
        <span class="popup-info-value">${pl.name}</span>
      </div>` : ''}
      <div class="popup-info-row">
        <span class="popup-info-label">전압</span>
        <span class="popup-info-value">${voltageKV}</span>
      </div>
      ${pl.cables ? `<div class="popup-info-row">
        <span class="popup-info-label">케이블</span>
        <span class="popup-info-value">${pl.cables}선</span>
      </div>` : ''}
    </div>
    <div style="margin-top:6px;font-size:0.7rem;color:#888;">🗺️ OpenStreetMap 경로 데이터</div>
  `;
}

// ──────────────────────────────────────
//  상세 패널
// ──────────────────────────────────────
async function showDetailPanel(ss) {
  const panel = document.getElementById("detail-panel");
  const content = document.getElementById("detail-content");
  const color = getStatusColor(ss.status);

  // 기본 정보 먼저 표시
  content.innerHTML = `
    <div class="detail-title" style="color: ${color};">
      ${getStatusEmoji(ss.status)} ${ss.name}
    </div>
    <div class="detail-section">
      <h4>변전소 정보</h4>
      <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value" style="color: ${color};">${ss.status}</span></div>
      <div class="detail-row"><span class="detail-label">코드</span><span class="detail-value">${ss.id}</span></div>
      <div class="detail-row"><span class="detail-label">지역</span><span class="detail-value">${ss.region}</span></div>
    </div>
    <div class="detail-section">
      <h4>용량 현황</h4>
      <div class="detail-row"><span class="detail-label">누적 연계용량</span><span class="detail-value">${Number(ss.usedMW).toLocaleString()} kW</span></div>
      <div class="detail-row"><span class="detail-label">변전소 여유용량</span><span class="detail-value" style="color: ${color}; font-size: 1.05rem;">${Number(ss.availableMW).toLocaleString()} kW</span></div>
      <div class="detail-row"><span class="detail-label">여유율</span><span class="detail-value" style="color: ${color};">${ss.availableRate}%</span></div>
    </div>
    <div class="detail-section" id="dl-loading">
      <h4>🔌 배전선(DL) 여유용량</h4>
      <p style="color:#888;font-size:0.8rem;">⏳ DL 상세 데이터 로딩중...</p>
    </div>
  `;
  panel.classList.remove("hidden");

  // DL 상세 데이터 비동기 로드
  try {
    const res = await fetch(`/kepco-grid-v2/api/substation?cd=${ss.id}`);
    const data = await res.json();
    const details = data.details || [];

    // 변압기별 → DL 그룹핑
    const mtrMap = {};
    details.forEach(d => {
      const mtrKey = d.mtr_no || '?';
      if (!mtrMap[mtrKey]) mtrMap[mtrKey] = { vol2: d.vol2 || 0, mtr_pwr: d.mtr_pwr || 0, dls: [] };
      mtrMap[mtrKey].vol2 = d.vol2 || mtrMap[mtrKey].vol2;
      mtrMap[mtrKey].mtr_pwr = d.mtr_pwr || mtrMap[mtrKey].mtr_pwr;
      mtrMap[mtrKey].dls.push(d);
    });

    let dlHtml = `<h4>🔌 배전선(DL) 여유용량 <span style="font-size:0.72rem;color:#888;font-weight:400;">${details.length}개 DL</span></h4>`;
    dlHtml += `<p style="font-size:0.72rem;color:#64748b;margin-bottom:8px;">⚡ 태양광 연계 시 DL별 여유용량(vol3) 확인 필수</p>`;

    Object.keys(mtrMap).sort().forEach(mtrNo => {
      const mtr = mtrMap[mtrNo];
      dlHtml += `<div style="margin:10px 0 6px;font-size:0.78rem;font-weight:600;color:#3b82f6;">변압기 #${mtrNo} <span style="font-weight:400;color:#888;">여유: ${Number(mtr.vol2).toLocaleString()}kW</span></div>`;

      mtr.dls.sort((a, b) => (b.vol3 || 0) - (a.vol3 || 0)).forEach(dl => {
        const dlPwr = dl.dl_pwr || 0;
        const dlVol3 = dl.vol3 || 0;
        const total = dlPwr + dlVol3;
        const usagePct = total > 0 ? (dlPwr / total * 100) : 0;
        const dlColor = dlVol3 > 5000 ? '#22c55e' : dlVol3 > 1000 ? '#eab308' : dlVol3 > 0 ? '#f97316' : '#ef4444';
        const dlStatus = dlVol3 > 5000 ? '연계가능' : dlVol3 > 1000 ? '소규모가능' : dlVol3 > 0 ? '거의포화' : '포화';

        dlHtml += `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-weight:600;font-size:0.82rem;">DL ${dl.dl_cd || '?'} ${dl.dl_nm || ''}</span>
              <span style="font-size:0.68rem;padding:2px 6px;border-radius:4px;background:${dlColor}18;color:${dlColor};font-weight:600;">${dlStatus}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#64748b;margin-bottom:3px;">
              <span>사용: ${Number(dlPwr).toLocaleString()}kW</span>
              <span style="color:${dlColor};font-weight:700;">여유: ${Number(dlVol3).toLocaleString()}kW</span>
            </div>
            <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
              <div style="height:100%;width:${usagePct.toFixed(1)}%;background:${dlColor};border-radius:2px;"></div>
            </div>
          </div>`;
      });
    });

    if (details.length === 0) {
      dlHtml += `<p style="color:#888;font-size:0.8rem;">DL 상세 데이터 없음</p>`;
    }

    document.getElementById('dl-loading').innerHTML = dlHtml;

    // ── 전주번호 + 대지 구입 추천 영역 ──
    const poleSection = document.createElement('div');
    poleSection.className = 'detail-section';
    const lat = ss.lat, lng = ss.lng;

    // TM 좌표 변환 (간략)
    const a = 6378137, f = 1 / 298.257222101, b = a * (1 - f), e2 = (a * a - b * b) / (a * a), ep2 = (a * a - b * b) / (b * b);
    const lng0 = lng < 126 ? 125 : lng < 128 ? 127 : lng < 130 ? 129 : 131;
    const originNm = { 125: '서부', 127: '중부', 129: '동부', 131: '동해' }[lng0];
    const p = lat * Math.PI / 180, l = lng * Math.PI / 180, l0 = lng0 * Math.PI / 180, p0 = 38 * Math.PI / 180;
    const N = a / Math.sqrt(1 - e2 * Math.sin(p) ** 2), T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = Math.cos(p) * (l - l0);
    const e4 = e2 ** 2, e6 = e4 * e2;
    const M = a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p));
    const M0 = a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p0 - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p0) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p0) - (35 * e6 / 3072) * Math.sin(6 * p0));
    const tmX = N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120) + 200000;
    const tmY = (M - M0 + N * Math.tan(p) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720)) + 500000;
    const gx = Math.floor(tmX / 2000) % 100, gy = Math.floor(tmY / 2000) % 100;
    const code = String(gx).padStart(2, '0') + String(gy).padStart(2, '0');

    // 여유율 높은 DL 찾기
    const topDLs = details.filter(d => (d.vol3 || 0) > 0).sort((a, b) => (b.vol3 || 0) - (a.vol3 || 0)).slice(0, 3);
    const topDLhtml = topDLs.length > 0
      ? topDLs.map(d => `<span style="color:#22c55e;font-weight:600;">DL${d.dl_cd} ${d.dl_nm || ''}</span> (${Number(d.vol3).toLocaleString()}kW)`).join('<br>')
      : '<span style="color:#ef4444;">연계 가능한 DL 없음</span>';

    poleSection.innerHTML = `
      <h4>📍 대지 구입 추천 영역</h4>
      <p style="font-size:0.72rem;color:#64748b;margin-bottom:8px;">변전소 주변 2km 관리구 내 전주번호 추정</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;margin-bottom:8px;">
        <div style="font-size:0.72rem;color:#64748b;">추정 전주번호 (관리구)</div>
        <div style="font-size:1.5rem;font-weight:800;color:#3b82f6;font-family:monospace;letter-spacing:2px;">${code} A~Z ***</div>
        <div style="font-size:0.68rem;color:#94a3b8;margin-top:2px;">${originNm}원점 | TM: ${Math.round(tmX).toLocaleString()}, ${Math.round(tmY).toLocaleString()}</div>
      </div>
      <div style="font-size:0.78rem;margin-bottom:6px;">
        <strong>🔌 연계 추천 DL</strong><br>${topDLhtml}
      </div>
      <button id="btn-show-area" style="width:100%;padding:8px;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:0.82rem;font-weight:600;cursor:pointer;">
        🗺️ 지도에 추천 영역 표시
      </button>
    `;

    document.getElementById('dl-loading').after(poleSection);

    // 추천 영역 지도 표시 버튼
    document.getElementById('btn-show-area').addEventListener('click', () => {
      // 기존 영역 제거
      if (window._searchArea) { map.removeLayer(window._searchArea); window._searchArea = null; }
      if (window._searchLabel) { map.removeLayer(window._searchLabel); window._searchLabel = null; }
      if (window._poleMarkers) { window._poleMarkers.forEach(m => map.removeLayer(m)); window._poleMarkers = []; }

      const kmPerDegLat = 111.32;
      const kmPerDegLng = 111.32 * Math.cos(lat * Math.PI / 180);
      const dLat = 0.4 / kmPerDegLat;  // 400m
      const dLng = 0.4 / kmPerDegLng;

      const bounds = [
        [lat - dLat, lng - dLng],
        [lat + dLat, lng + dLng]
      ];

      window._searchArea = L.rectangle(bounds, {
        color: '#3b82f6', weight: 2, fillOpacity: 0.08,
        dashArray: '6,4'
      }).addTo(map);

      // 전주번호 라벨 표시 (3x3 그리드)
      window._poleMarkers = [];
      const subLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      let idx = 0;
      for (let row = -1; row <= 1; row++) {
        for (let col = -1; col <= 1; col++) {
          const pLat = lat + row * dLat * 0.6;
          const pLng = lng + col * dLng * 0.6;
          const letter = subLetters[idx];
          const poleNo = `${code}${letter}${String(Math.floor(Math.random() * 900) + 100)}`;
          const m = L.marker([pLat, pLng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:#fff;border:1px solid #3b82f6;color:#1e40af;padding:2px 5px;border-radius:3px;font-size:0.65rem;font-weight:700;font-family:monospace;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.15);">⚡${poleNo}</div>`,
              iconAnchor: [30, 10]
            })
          }).addTo(map);
          window._poleMarkers.push(m);
          idx++;
        }
      }

      window._searchLabel = L.marker([lat + dLat * 1.1, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#3b82f6;color:#fff;padding:3px 8px;border-radius:4px;font-size:0.72rem;font-weight:600;white-space:nowrap;">📍 대지 추천 (관리구 ' + code + ')</div>',
          iconAnchor: [80, 20]
        })
      }).addTo(map);

      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    });

  } catch (err) {
    document.getElementById('dl-loading').innerHTML = `<h4>🔌 배전선(DL)</h4><p style="color:#ef4444;font-size:0.8rem;">로드 실패: ${err.message}</p>`;
  }
}

document.getElementById("detail-close").addEventListener("click", () => {
  document.getElementById("detail-panel").classList.add("hidden");
});

// ──────────────────────────────────────
//  통계 업데이트
// ──────────────────────────────────────
function updateStats() {
  const filtered = getFilteredSubstations();
  const total = filtered.length;
  const available = filtered.filter(ss => ss.status === "여유").length;
  const normal = filtered.filter(ss => ss.status === "보통").length;
  const caution = filtered.filter(ss => ss.status === "주의").length;
  const saturated = filtered.filter(ss => ss.status === "포화").length;

  animateValue("stat-total", total);
  animateValue("stat-available", available);
  animateValue("stat-normal", normal);
  animateValue("stat-caution", caution);
  animateValue("stat-saturated", saturated);
  animateValue("stat-substations", substations.length);
}

function animateValue(elementId, target) {
  const el = document.querySelector(`#${elementId} .stat-value`);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  const duration = 500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(current + diff * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ──────────────────────────────────────
//  필터
// ──────────────────────────────────────
function initFilters() {
  // 권역 버튼 동적 생성
  const regionContainer = document.getElementById("region-filters");
  // 기존 "전체" 이외의 버튼 삭제
  regionContainer.querySelectorAll('.filter-btn:not([data-region="all"])').forEach(b => b.remove());

  regions.forEach(region => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.region = region;
    btn.textContent = region;
    regionContainer.appendChild(btn);
  });

  // 상태 필터
  document.getElementById("status-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#status-filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilters.status = btn.dataset.status;
    applyFilters();
  });

  // 전압 필터 — 실제 API에서는 전압 구분이 없으므로 간단 처리
  document.getElementById("voltage-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#voltage-filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilters.voltage = btn.dataset.voltage;
    applyFilters();
  });

  // 권역 필터
  document.getElementById("region-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#region-filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilters.region = btn.dataset.region;
    applyFilters();
  });
}

function getFilteredSubstations() {
  return substations.filter(ss => {
    if (activeFilters.status !== "all" && ss.status !== activeFilters.status) return false;
    if (activeFilters.voltage !== "all" && ss.voltageKV !== parseInt(activeFilters.voltage)) return false;
    if (activeFilters.region !== "all" && ss.region !== activeFilters.region) return false;
    return true;
  });
}

function applyFilters() {
  const filteredSubs = getFilteredSubstations();
  const filteredSubIds = new Set(filteredSubs.map(ss => ss.id));

  // 변전소 표시/숨김
  substationMarkers.forEach(({ marker, data }) => {
    if (filteredSubIds.has(data.id)) {
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    }
  });

  updateStats();
}

// ──────────────────────────────────────
// ──────────────────────────────────────
//  검색 (주소 검색으로 대체됨)
// ──────────────────────────────────────
function initSearch() {
  // 주소 검색(initAddressSearch)으로 대체 — 빈 함수 유지
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.substring(0, idx) +
    '<strong style="color: var(--accent-light);">' +
    text.substring(idx, idx + query.length) +
    '</strong>' +
    text.substring(idx + query.length);
}

// ──────────────────────────────────────
//  사이드바 토글
// ──────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mapEl = document.getElementById("map");
  const toggleBtn = document.getElementById("sidebar-toggle");
  const openBtn = document.getElementById("sidebar-open");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.add("collapsed");
    mapEl.classList.add("expanded");
    openBtn.classList.add("visible");
    setTimeout(() => map.invalidateSize(), 350);
  });

  openBtn.addEventListener("click", () => {
    sidebar.classList.remove("collapsed");
    mapEl.classList.remove("expanded");
    openBtn.classList.remove("visible");
    setTimeout(() => map.invalidateSize(), 350);
  });
}
